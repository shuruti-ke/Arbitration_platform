'use strict';
// src/services/hearing-service.js
// Hearing scheduling and arbitrator assignment workflow

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const STRICT_DB = process.env.NODE_ENV === 'production';

class HearingService {
  constructor(dbService = null) {
    this.dbService = dbService;
    this.hearings = new Map();
    this.assignments = new Map(); // caseId -> arbitrator panel
  }

  // --- Arbitrator Assignment ---

  async assignArbitrator({ caseId, arbitratorId, role = 'sole', appointedBy }) {
    if (!caseId || !arbitratorId) throw new Error('caseId and arbitratorId are required');

    const assignmentId = 'assign-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    const assignment = {
      assignmentId,
      caseId,
      arbitratorId,
      role, // sole | presiding | co-arbitrator | emergency
      appointedBy,
      status: 'pending_acceptance',
      assignedAt: new Date().toISOString(),
      acceptedAt: null,
      declinedAt: null
    };

    if (!this.assignments.has(caseId)) this.assignments.set(caseId, []);
    this.assignments.get(caseId).push(assignment);

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          `INSERT INTO arbitrator_assignments
            (assignment_id, case_id, arbitrator_id, role, appointed_by, status, assigned_at)
           VALUES (:assignmentId, :caseId, :arbitratorId, :role, :appointedBy, :status, CURRENT_TIMESTAMP)`,
          { assignmentId, caseId, arbitratorId, role, appointedBy, status: assignment.status }
        );
      } catch (err) {
        console.error('Assignment DB write failed:', err.message);
        if (STRICT_DB) throw err;
      }
    } else if (STRICT_DB) {
      throw new Error('Assignment DB is not connected');
    }

    console.log(`Arbitrator ${arbitratorId} assigned to case ${caseId} as ${role}`);
    return assignment;
  }

  async respondToAssignment(assignmentId, caseId, response, reason = '') {
    if (!['accepted', 'declined'].includes(response)) throw new Error('response must be accepted or declined');

    const panel = this.assignments.get(caseId) || [];
    const assignment = panel.find(a => a.assignmentId === assignmentId);
    if (!assignment) throw new Error('Assignment not found');

    assignment.status = response;
    assignment[response === 'accepted' ? 'acceptedAt' : 'declinedAt'] = new Date().toISOString();
    if (reason) assignment.declineReason = reason;

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          `UPDATE arbitrator_assignments SET status = :status,
            accepted_at = ${response === 'accepted' ? 'CURRENT_TIMESTAMP' : 'NULL'},
            declined_at = ${response === 'declined' ? 'CURRENT_TIMESTAMP' : 'NULL'}
           WHERE assignment_id = :assignmentId`,
          { status: response, assignmentId }
        );
      } catch (err) {
        console.error('Assignment response DB write failed:', err.message);
        if (STRICT_DB) throw err;
      }
    } else if (STRICT_DB) {
      throw new Error('Assignment DB is not connected');
    }

    return assignment;
  }

  async getPanel(caseId) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        const result = await this.dbService.executeQuery(
          'SELECT * FROM arbitrator_assignments WHERE case_id = :caseId ORDER BY assigned_at',
          { caseId }
        );
        return result.rows || [];
      } catch (err) {
        console.error('Panel DB read failed:', err.message);
        if (STRICT_DB) throw err;
      }
    } else if (STRICT_DB) {
      throw new Error('Assignment DB is not connected');
    }
    return this.assignments.get(caseId) || [];
  }

  // --- Hearing Management ---

  async scheduleHearing({ caseId, scheduledBy, title, startTime, endTime, type = 'virtual', agenda = '' }) {
    if (!caseId || !startTime || !endTime) throw new Error('caseId, startTime, and endTime are required');

    const hearingId = 'hearing-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    const jitsiRoom = `arb-${caseId}-${hearingId}`.replace(/[^a-zA-Z0-9-]/g, '-');

    const hearing = {
      hearingId,
      caseId,
      title: title || `Hearing - ${caseId}`,
      scheduledBy,
      startTime,
      endTime,
      type, // virtual | in-person | hybrid
      agenda,
      jitsiRoom,
      status: 'scheduled', // scheduled | in-progress | completed | cancelled
      createdAt: new Date().toISOString(),
      participants: []
    };

    this.hearings.set(hearingId, hearing);

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          `INSERT INTO hearings
            (hearing_id, case_id, title, scheduled_by, start_time, end_time, type, agenda, jitsi_room, status, created_at)
           VALUES (:hearingId, :caseId, :title, :scheduledBy, :startTime, :endTime, :type, :agenda, :jitsiRoom, 'scheduled', CURRENT_TIMESTAMP)`,
          { hearingId, caseId, title: hearing.title, scheduledBy, startTime, endTime, type, agenda, jitsiRoom }
        );
      } catch (err) {
        console.error('Hearing DB write failed:', err.message);
        if (STRICT_DB) throw err;
      }
    } else if (STRICT_DB) {
      throw new Error('Hearing DB is not connected');
    }

    console.log(`Hearing scheduled: ${hearingId} for case ${caseId} at ${startTime}`);
    return hearing;
  }

  async getHearing(hearingId) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        const result = await this.dbService.executeQuery(
          'SELECT * FROM hearings WHERE hearing_id = :hearingId',
          { hearingId }
        );
        if (result.rows && result.rows[0]) return result.rows[0];
      } catch (err) {
        console.error('Hearing DB read failed:', err.message);
        if (STRICT_DB) throw err;
      }
    } else if (STRICT_DB) {
      throw new Error('Hearing DB is not connected');
    }
    return this.hearings.get(hearingId) || null;
  }

  async getCaseHearings(caseId) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        const result = await this.dbService.executeQuery(
          'SELECT * FROM hearings WHERE case_id = :caseId ORDER BY start_time',
          { caseId }
        );
        return result.rows || [];
      } catch (err) {
        console.error('Case hearings DB read failed:', err.message);
        if (STRICT_DB) throw err;
      }
    } else if (STRICT_DB) {
      throw new Error('Hearing DB is not connected');
    }
    return Array.from(this.hearings.values()).filter(h => h.caseId === caseId);
  }

  async updateHearingStatus(hearingId, status) {
    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) throw new Error(`Invalid status: ${status}`);

    const hearing = this.hearings.get(hearingId);
    if (hearing) hearing.status = status;

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          'UPDATE hearings SET status = :status WHERE hearing_id = :hearingId',
          { status, hearingId }
        );
      } catch (err) {
        console.error('Hearing status DB write failed:', err.message);
        if (STRICT_DB) throw err;
      }
    } else if (STRICT_DB) {
      throw new Error('Hearing DB is not connected');
    }

    return hearing || { hearingId, status };
  }

  async deleteHearing(hearingId) {
    const hearing = await this.getHearing(hearingId);
    if (!hearing) throw new Error('Hearing not found');

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          'DELETE FROM hearing_participants WHERE hearing_id = :hearingId',
          { hearingId }
        );
        await this.dbService.executeQuery(
          'DELETE FROM hearings WHERE hearing_id = :hearingId',
          { hearingId }
        );
      } catch (err) {
        console.error('Hearing delete DB write failed:', err.message);
        throw err;
      }
    }

    this.hearings.delete(hearingId);
    return hearing;
  }

  async addParticipant(hearingId, userId, role) {
    const participant = { userId, role, joinedAt: new Date().toISOString() };

    if (this.dbService && this.dbService.isConnected()) {
      try {
        await this.dbService.executeQuery(
          `INSERT INTO hearing_participants (hearing_id, user_id, role, joined_at)
           VALUES (:hearingId, :userId, :role, CURRENT_TIMESTAMP)`,
          { hearingId, userId, role }
        );
      } catch (err) {
        console.error('Participant DB write failed:', err.message);
      }
    }

    return participant;
  }

  async getAllHearings(user) {
    if (this.dbService && this.dbService.isConnected()) {
      try {
        let sql = 'SELECT * FROM hearings';
        const params = {};
        if (user.role === 'party' || user.role === 'counsel') {
          sql += ' WHERE case_id IN (SELECT DISTINCT case_id FROM parties WHERE user_id = :userId UNION SELECT DISTINCT case_id FROM case_counsel WHERE user_id = :userId2)';
          params.userId = user.userId;
          params.userId2 = user.userId;
        }
        sql += ' ORDER BY start_time DESC';
        const result = await this.dbService.executeQuery(sql, params);
        return result.rows || [];
      } catch (err) {
        console.error('Get all hearings failed:', err.message);
      }
    }
    return Array.from(this.hearings.values());
  }

  getJitsiRoomUrl(jitsiBaseUrl, jitsiRoom) {
    return `${jitsiBaseUrl}/${jitsiRoom}`;
  }

  getDailyRoomName(hearing) {
    const existingRoom = hearing.jitsiRoom || hearing.JITSI_ROOM || hearing.dailyRoom || hearing.DAILY_ROOM;
    const fallback = `arb-${hearing.caseId || hearing.CASE_ID}-${hearing.hearingId || hearing.HEARING_ID}`;
    return String(existingRoom || fallback)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120);
  }

  async getDailyJoinUrl({ dailyConfig, hearing, user, isModerator }) {
    if (!dailyConfig || !dailyConfig.apiKey) {
      return null;
    }

    const roomName = this.getDailyRoomName(hearing);
    const room = await this.ensureDailyRoom({ dailyConfig, hearing, roomName });
    const token = await this.createDailyMeetingToken({ dailyConfig, hearing, roomName, user, isModerator });
    return token ? `${room.url}?t=${encodeURIComponent(token)}` : room.url;
  }

  async ensureDailyRoom({ dailyConfig, hearing, roomName }) {
    const existing = await this.dailyRequest(dailyConfig, `/rooms/${encodeURIComponent(roomName)}`, {
      method: 'GET',
      tolerate404: true
    });
    if (existing) return existing;

    const nbf = this._toUnixSeconds(hearing.startTime || hearing.START_TIME, -15 * 60);
    const exp = this._toUnixSeconds(hearing.endTime || hearing.END_TIME, 2 * 60 * 60);
    const roomBody = {
      name: roomName,
      privacy: 'private',
      properties: {
        nbf,
        exp,
        eject_at_room_exp: true,
        enable_prejoin_ui: false,
        enable_live_captions_ui: true,
        enable_people_ui: true,
        enable_screenshare: true,
        enable_chat: true,
        enable_recording: 'cloud',
        enable_transcription_storage: true,
        start_video_off: false,
        start_audio_off: false,
        permissions: {
          hasPresence: true,
          canSend: true,
          canReceive: {},
          canAdmin: false
        }
      }
    };

    return this.dailyRequest(dailyConfig, '/rooms', {
      method: 'POST',
      body: roomBody
    });
  }

  async createDailyMeetingToken({ dailyConfig, hearing, roomName, user, isModerator }) {
    const exp = this._toUnixSeconds(hearing.endTime || hearing.END_TIME, 2 * 60 * 60);
    const userName = `${user.firstName || user.FIRST_NAME || ''} ${user.lastName || user.LAST_NAME || ''}`.trim()
      || user.email
      || user.userId;
    const body = {
      properties: {
        room_name: roomName,
        exp,
        eject_at_token_exp: true,
        is_owner: !!isModerator,
        user_name: userName,
        user_id: String(user.userId || user.USER_ID || '').slice(0, 36),
        enable_prejoin_ui: false,
        enable_live_captions_ui: true,
        enable_recording: 'cloud',
        enable_recording_ui: !!isModerator,
        start_video_off: false,
        start_audio_off: false,
        close_tab_on_exit: dailyConfig.closeTabOnExit !== false,
        permissions: {
          hasPresence: true,
          canSend: true,
          canReceive: {},
          canAdmin: isModerator ? ['participants', 'transcription'] : false
        }
      }
    };

    if (isModerator && dailyConfig.autoRecord) {
      body.properties.start_cloud_recording = true;
      body.properties.start_cloud_recording_opts = {
        type: 'cloud',
        dataOutputs: ['event-json', 'transcript-webvtt']
      };
    }

    if (isModerator && dailyConfig.autoTranscribe) {
      body.properties.auto_start_transcription = true;
    }

    const token = await this.dailyRequest(dailyConfig, '/meeting-tokens', {
      method: 'POST',
      body
    });
    return token && token.token;
  }

  async dailyRequest(dailyConfig, path, { method = 'GET', body, tolerate404 = false } = {}) {
    const res = await fetch(`https://api.daily.co/v1${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${dailyConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (res.status === 404 && tolerate404) return null;
    const text = await res.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = { error: text }; }
    }

    if (!res.ok) {
      const message = payload && (payload.error || payload.info) ? (payload.error || payload.info) : `Daily API ${res.status}`;
      throw new Error(`Daily API request failed: ${message}`);
    }

    return payload || {};
  }

  _toUnixSeconds(value, fallbackOffsetSeconds) {
    const parsed = value ? Date.parse(value) : NaN;
    const base = Number.isNaN(parsed) ? Date.now() : parsed;
    return Math.floor((base + fallbackOffsetSeconds * 1000) / 1000);
  }

  generateJaaSJwt({ appId, apiKeyId, privateKey, user, room, isModerator = false }) {
    if (!appId || !apiKeyId || !privateKey) return null;
    try {
      const normalizedAppId = String(appId || '').trim().split('/').filter(Boolean)[0] || '';
      const normalizedApiKeyId = String(apiKeyId || '').trim().split('/').filter(Boolean).pop() || '';
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: 'chat',
        iat: now,
        exp: now + 7200,
        nbf: now - 10,
        aud: 'jitsi',
        sub: normalizedAppId,
        room: '*',
        context: {
          user: {
            id: user.userId,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email,
            moderator: isModerator
          },
          features: {
            recording: isModerator,
            livestreaming: false,
            transcription: false,
            'outbound-call': false
          }
        }
      };
      const pem = this._normalizeJaaSPrivateKey(privateKey);
      const key = crypto.createPrivateKey({ key: pem, format: 'pem' });
      return jwt.sign(payload, key, { algorithm: 'RS256', header: { kid: normalizedApiKeyId, alg: 'RS256' } });
    } catch (err) {
      console.error('JaaS JWT error:', err.message);
      return null;
    }
  }

  getJaaSRoomUrl({ appId, apiKeyId, privateKey, jitsiRoom, user, isModerator }) {
    const token = this.generateJaaSJwt({ appId, apiKeyId, privateKey, user, room: jitsiRoom, isModerator });
    const normalizedAppId = String(appId || '').trim().split('/').filter(Boolean)[0] || '';
    const baseUrl = `https://8x8.vc/${normalizedAppId}/${jitsiRoom}`;
    return token ? `${baseUrl}?jwt=${token}` : baseUrl;
  }

  _normalizeJaaSPrivateKey(rawKey) {
    let keyText = String(rawKey || '').trim();
    if (keyText.length >= 2 && keyText[0] === keyText[keyText.length - 1] && (keyText[0] === '"' || keyText[0] === "'")) {
      keyText = keyText.slice(1, -1).trim();
    }
    keyText = keyText.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

    if (keyText.includes('-----BEGIN') && keyText.includes('PRIVATE KEY')) {
      if (!keyText.endsWith('\n')) keyText += '\n';
      return keyText;
    }

    try {
      const decoded = Buffer.from(keyText, 'base64').toString('utf8').trim();
      if (decoded.includes('-----BEGIN') && decoded.includes('PRIVATE KEY')) {
        return decoded.endsWith('\n') ? decoded : `${decoded}\n`;
      }
    } catch (err) {
      // Fall through to the validation error below.
    }

    throw new Error('JAAS_PRIVATE_KEY must be a PEM private key or base64-encoded PEM');
  }
}

module.exports = HearingService;
