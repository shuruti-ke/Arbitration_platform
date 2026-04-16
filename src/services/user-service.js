'use strict';
// src/services/user-service.js
// User management with role-based access control

const bcrypt = require('bcryptjs');

const ROLES = {
  ADMIN: 'admin',
  ARBITRATOR: 'arbitrator',
  PARTY: 'party',
  COUNSEL: 'counsel',
  SECRETARIAT: 'secretariat'
};

const ROLE_PERMISSIONS = {
  admin:       ['*'],
  secretariat: ['cases:read', 'cases:write', 'hearings:read', 'hearings:write', 'documents:read', 'documents:write', 'users:read'],
  arbitrator:  ['cases:read', 'hearings:read', 'hearings:write', 'documents:read', 'awards:write', 'conflicts:read'],
  counsel:     ['cases:read', 'hearings:read', 'documents:read', 'documents:write', 'consent:write'],
  party:       ['cases:read', 'hearings:read', 'documents:read', 'consent:write']
};

class UserService {
  constructor(dbService = null) {
    this.dbService = dbService;
    this.users = new Map(); // in-memory fallback
    this._seedAdmin();
  }

  async _seedAdmin() {
    const existing = await this.findByEmail('admin@arbitration.platform');
    if (!existing) {
      await this.createUser({
        email: 'admin@arbitration.platform',
        password: 'Admin@2026!',
        firstName: 'System',
        lastName: 'Administrator',
        role: ROLES.ADMIN
      });
    }
  }

  async createUser({ email, password, firstName, lastName, role }) {
    if (!email || !password || !role) throw new Error('email, password, and role are required');
    if (!ROLES[role.toUpperCase()]) throw new Error(`Invalid role: ${role}`);

    const existing = await this.findByEmail(email);
    if (existing) throw new Error('User with this email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

    const user = {
      userId,
      email: email.toLowerCase().trim(),
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          `INSERT INTO users (user_id, email, password_hash, first_name, last_name, role, is_active, created_at)
           VALUES (:userId, :email, :passwordHash, :firstName, :lastName, :role, 1, CURRENT_TIMESTAMP)`,
          { userId, email: user.email, passwordHash, firstName, lastName, role }
        );
      } catch (err) {
        console.error('User DB write failed:', err.message);
      }
    }

    this.users.set(userId, user);
    console.log(`User created: ${email} (${role})`);
    return this._safeUser(user);
  }

  async findByEmail(email) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();

    if (this.dbService && this.dbService.isConnected()) {
      try {
        const result = await this.dbService.executeQuery(
          'SELECT * FROM users WHERE email = :email AND is_active = 1',
          { email: normalized }
        );
        if (result.rows && result.rows[0]) return result.rows[0];
      } catch (err) {
        console.error('User DB read failed, using in-memory:', err.message);
      }
    }

    for (const user of this.users.values()) {
      if (user.email === normalized) return user;
    }
    return null;
  }

  async findById(userId) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        const result = await this.dbService.executeQuery(
          'SELECT * FROM users WHERE user_id = :userId AND is_active = 1',
          { userId }
        );
        if (result.rows && result.rows[0]) return result.rows[0];
      } catch (err) {
        console.error('User DB read failed, using in-memory:', err.message);
      }
    }
    return this.users.get(userId) || null;
  }

  async verifyPassword(user, password) {
    const hash = user.passwordHash || user.PASSWORD_HASH;
    return bcrypt.compare(password, hash);
  }

  async listUsers(filters = {}) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        let sql = 'SELECT user_id, email, first_name, last_name, role, is_active, created_at FROM users WHERE 1=1';
        const params = {};
        if (filters.role) { sql += ' AND role = :role'; params.role = filters.role; }
        sql += ' ORDER BY created_at DESC';
        const result = await this.dbService.executeQuery(sql, params);
        return result.rows || [];
      } catch (err) {
        console.error('User list DB read failed:', err.message);
      }
    }
    return Array.from(this.users.values())
      .filter(u => !filters.role || u.role === filters.role)
      .map(u => this._safeUser(u));
  }

  async deactivateUser(userId) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          'UPDATE users SET is_active = 0 WHERE user_id = :userId',
          { userId }
        );
      } catch (err) {
        console.error('User deactivate DB write failed:', err.message);
      }
    }

    if (this.users.has(userId)) {
      this.users.get(userId).isActive = false;
    }
    return true;
  }

  async restoreUser(userId) {
    let exists = this.users.has(userId);
    if (!exists && this.dbService && this.dbService.isConnected()) {
      try {
        const result = await this.dbService.executeQuery(
          'SELECT user_id FROM users WHERE user_id = :userId',
          { userId }
        );
        exists = !!(result.rows && result.rows[0]);
      } catch (err) {
        console.error('User restore lookup failed:', err.message);
        throw err;
      }
    }
    if (!exists) throw new Error('User not found');

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          'UPDATE users SET is_active = 1 WHERE user_id = :userId',
          { userId }
        );
      } catch (err) {
        console.error('User restore DB write failed:', err.message);
        throw err;
      }
    }

    if (this.users.has(userId)) {
      this.users.get(userId).isActive = true;
    }
    return true;
  }

  async deleteUser(userId) {
    let exists = this.users.has(userId);
    if (!exists && this.dbService && this.dbService.isConnected()) {
      try {
        const result = await this.dbService.executeQuery(
          'SELECT user_id FROM users WHERE user_id = :userId',
          { userId }
        );
        exists = !!(result.rows && result.rows[0]);
      } catch (err) {
        console.error('User delete lookup failed:', err.message);
        throw err;
      }
    }
    if (!exists) throw new Error('User not found');

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          'DELETE FROM users WHERE user_id = :userId',
          { userId }
        );
      } catch (err) {
        console.error('User delete DB write failed:', err.message);
        throw err;
      }
    }

    this.users.delete(userId);
    return true;
  }

  hasPermission(role, permission) {
    const perms = ROLE_PERMISSIONS[role] || [];
    return perms.includes('*') || perms.includes(permission);
  }

  _safeUser(user) {
    // Normalize Oracle uppercase column names to camelCase/lowercase
    const normalized = {
      userId:    user.userId    || user.USER_ID,
      email:     user.email     || user.EMAIL,
      firstName: user.firstName || user.FIRST_NAME,
      lastName:  user.lastName  || user.LAST_NAME,
      role:      user.role      || user.ROLE,
      isActive:  user.isActive  !== undefined ? user.isActive : user.IS_ACTIVE,
      createdAt: user.createdAt || user.CREATED_AT,
    };
    return normalized;
  }
}

module.exports = { UserService, ROLES, ROLE_PERMISSIONS };
