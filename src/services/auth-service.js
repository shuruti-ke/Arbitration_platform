'use strict';
// src/services/auth-service.js
// JWT authentication service

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'arbitration-platform-jwt-secret-2026-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const REFRESH_EXPIRES_IN = '7d';

class AuthService {
  constructor(userService, auditTrail) {
    this.userService = userService;
    this.auditTrail = auditTrail;
    this.blacklistedTokens = new Set(); // in-memory token blacklist
  }

  async login(email, password, ipAddress = 'unknown') {
    if (!email || !password) throw new Error('Email and password are required');

    const user = await this.userService.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    const isActive = user.isActive !== undefined ? user.isActive : user.IS_ACTIVE;
    if (!isActive) throw new Error('Account is deactivated');

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

  async logout(token, userId) {
    this.blacklistedTokens.add(token);
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
