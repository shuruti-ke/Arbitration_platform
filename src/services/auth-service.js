'use strict';
// src/services/auth-service.js
// JWT authentication service

const jwt = require('jsonwebtoken');

// F-001 remediation: refuse to start if JWT_SECRET is missing or is the insecure default
const INSECURE_DEFAULT = 'arbitration-platform-jwt-secret-2026-change-in-production';
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === INSECURE_DEFAULT) {
  console.error('FATAL: JWT_SECRET environment variable is not set or is the insecure default value.');
  console.error('Generate a secure secret with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_EXPIRES_IN = '7d';

class AuthService {
  constructor(userService, auditTrail, db) {
    this.userService = userService;
    this.auditTrail = auditTrail;
    this.db = db; // F-004 remediation: DB reference for persistent blacklist
    this.blacklistedTokens = new Set(); // in-memory cache (backed by DB)
  }

  async login(email, password, ipAddress = 'unknown') {
    if (!email || !password) throw new Error('Email and password are required');

    const user = await this.userService.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    const isActive = user.isActive !== undefined ? user.isActive : user.IS_ACTIVE;
    if (!isActive) throw new Error('Account is deactivated');

    const hash = user.passwordHash || user.PASSWORD_HASH;
    if (!hash) throw new Error('Invalid credentials');

    const valid = await this.userService.verifyPassword(user, password);
    if (!valid) throw new Error('Invalid credentials');

    const userId = user.userId || user.USER_ID;
    const role = user.role || user.ROLE;

    const payload = {
      userId,
      email: user.email || user.EMAIL,
      role,
      firstName: user.firstName || user.FIRST_NAME,
      lastName: user.lastName || user.LAST_NAME
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

    await this.auditTrail.logEvent({
      type: 'auth_login',
      userId,
      action: 'login',
      details: { email, ipAddress }
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      user: this.userService._safeUser(user)
    };
  }

  async logout(token, userId, refreshToken = null) {
    // F-004 remediation: blacklist both access token and refresh token
    this.blacklistedTokens.add(token);
    if (refreshToken) this.blacklistedTokens.add(refreshToken);

    // Persist to DB so blacklist survives server restarts
    if (this.db) {
      try {
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d max (refresh token lifetime)
        await this.db.executeQuery(
          `INSERT INTO token_blacklist (token_hash, expires_at) VALUES (:tokenHash, :expiresAt)
           ON CONFLICT (token_hash) DO NOTHING`,
          { tokenHash: require('crypto').createHash('sha256').update(token).digest('hex'), expiresAt: expiry }
        ).catch(() => {}); // Swallow if table not yet migrated
        if (refreshToken) {
          await this.db.executeQuery(
            `INSERT INTO token_blacklist (token_hash, expires_at) VALUES (:tokenHash, :expiresAt)
             ON CONFLICT (token_hash) DO NOTHING`,
            { tokenHash: require('crypto').createHash('sha256').update(refreshToken).digest('hex'), expiresAt: expiry }
          ).catch(() => {});
        }
      } catch { /* DB unavailable — in-memory blacklist still active */ }
    }

    await this.auditTrail.logEvent({
      type: 'auth_logout',
      userId,
      action: 'logout'
    });
    return true;
  }

  async refreshToken(refreshToken) {
    if (this.blacklistedTokens.has(refreshToken)) {
      throw new Error('Token has been revoked');
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    if (decoded.type !== 'refresh') throw new Error('Invalid refresh token');

    const user = await this.userService.findById(decoded.userId);
    if (!user) throw new Error('User not found');

    const isActive = user.isActive !== undefined ? user.isActive : user.IS_ACTIVE;
    if (!isActive) throw new Error('Account is deactivated');

    const payload = {
      userId: user.userId || user.USER_ID,
      email: user.email || user.EMAIL,
      role: user.role || user.ROLE,
      firstName: user.firstName || user.FIRST_NAME,
      lastName: user.lastName || user.LAST_NAME
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { accessToken, expiresIn: JWT_EXPIRES_IN };
  }

  async isTokenRevoked(token) {
    if (this.blacklistedTokens.has(token)) return true;
    // Check DB blacklist (handles tokens revoked before restart)
    if (this.db) {
      try {
        const hash = require('crypto').createHash('sha256').update(token).digest('hex');
        const result = await this.db.executeQuery(
          `SELECT 1 FROM token_blacklist WHERE token_hash = :hash AND expires_at > NOW() LIMIT 1`,
          { hash }
        ).catch(() => null);
        if (result && result.rows && result.rows.length > 0) {
          this.blacklistedTokens.add(token); // Cache locally
          return true;
        }
      } catch { /* DB unavailable — proceed with in-memory check only */ }
    }
    return false;
  }

  verifyToken(token) {
    if (this.blacklistedTokens.has(token)) throw new Error('Token has been revoked');
    return jwt.verify(token, JWT_SECRET);
  }

  extractToken(req) {
    const auth = req.headers['authorization'];
    if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
    return null;
  }

  // Middleware factory
  requireAuth(roles = []) {
    return (req, res, next, sendJSON) => {
      try {
        const token = this.extractToken(req);
        if (!token) return sendJSON(res, 401, { error: 'Authentication required' });

        const decoded = this.verifyToken(token);
        req.user = decoded;

        if (roles.length > 0 && !roles.includes(decoded.role) && decoded.role !== 'admin') {
          return sendJSON(res, 403, { error: 'Insufficient permissions' });
        }

        next();
      } catch (err) {
        return sendJSON(res, 401, { error: 'Invalid or expired token' });
      }
    };
  }
}

module.exports = AuthService;
