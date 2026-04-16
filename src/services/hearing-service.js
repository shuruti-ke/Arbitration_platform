'use strict';
// src/services/hearing-service.js
// Hearing scheduling and arbitrator assignment workflow

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
      }
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
      }
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
        console.error('Panel DB read failed, using in-memory:', err.message);
      }
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
      }
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
        console.error('Hearing DB read failed, using in-memory:', err.message);
      }
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
        console.error('Case hearings DB read failed, using in-memory:', err.message);
      }
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
      }
    }

    return hearing || { hearingId, status };
  }

  async addParticipant(hearingId, userId, role) {
    const hearing = this.hearings.get(hearingId);
    if (!hearing) throw new Error('Hearing not found');

    const participant = { userId, role, joinedAt: new Date().toISOString() };
    hearing.participants.push(participant);

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

  getJitsiRoomUrl(jitsiBaseUrl, jitsiRoom) {
    return `${jitsiBaseUrl}/${jitsiRoom}`;
  }

  generateJaaSJwt({ appId, apiKeyId, privateKey, user, room, isModerator = false }) {
    if (!appId || !apiKeyId || !privateKey) return null;
    try {
      const jwt = require('jsonwebtoken');
      const crypto = require('crypto');
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: 'chat',
        iat: now,
        exp: now + 7200,
        nbf: now - 10,
        aud: 'jitsi',
        sub: appId,
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
      // Decode base64 key back to PEM if needed, then create crypto KeyObject
      let pem = privateKey;
      if (!pem.includes('-----BEGIN')) {
        pem = Buffer.from(pem, 'base64').toString('utf8');
      }
      const key = crypto.createPrivateKey(pem);
      return jwt.sign(payload, key, { algorithm: 'RS256', header: { kid: apiKeyId, alg: 'RS256' } });
    } catch (err) {
      console.error('JaaS JWT error:', err.message);
      return null;
    }
  }

  getJaaSRoomUrl({ appId, apiKeyId, privateKey, jitsiRoom, user, isModerator }) {
    const token = this.generateJaaSJwt({ appId, apiKeyId, privateKey, user, room: jitsiRoom, isModerator });
    const baseUrl = `https://8x8.vc/${appId}/${jitsiRoom}`;
    return token ? `${baseUrl}?jwt=${token}` : baseUrl;
  }
}

module.exports = HearingService;
