'use strict';
// src/services/email-service.js
const nodemailer = require('nodemailer');

const ROLE_DESCRIPTIONS = {
  admin:       'Platform Administrator — full access to all cases, users, documents and settings',
  secretariat: 'Secretariat — create and manage cases, coordinate hearings and documents',
  arbitrator:  'Arbitrator — review assigned cases, conduct hearings and issue binding awards',
  counsel:     'Legal Counsel — represent your client, file submissions and evidence',
  party:       'Party to Arbitration — track your case, upload documents and attend hearings'
};

class EmailService {
  constructor() {
    this.from = process.env.EMAIL_USER;
    this.enabled = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: { rejectUnauthorized: false }
      });
      console.log(`Email service ready (${process.env.EMAIL_USER})`);
    } else {
      console.warn('Email service disabled — set EMAIL_USER and EMAIL_PASS in .env.oracle');
    }
  }

  async sendWelcomeEmail({ toEmail, firstName, password, role }) {
    if (!this.enabled) {
      console.warn(`Email not sent to ${toEmail} — email service not configured`);
      return { sent: false };
    }

    const roleDesc = ROLE_DESCRIPTIONS[role] || role;
    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <!-- Header -->
      <tr>
        <td style="background:#1976d2;padding:28px 32px;">
          <h1 style="margin:0;color:#fff;font-size:22px;">Arbitration Platform</h1>
          <p style="margin:6px 0 0;color:#bbdefb;font-size:14px;">Your account is ready</p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;color:#333;">Dear <strong>${firstName || 'User'}</strong>,</p>
          <p style="margin:0 0 24px;color:#555;">Your account has been created on the Arbitration Platform. Use the credentials below to log in.</p>

          <!-- Credentials box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:24px;">
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #e0e0e0;">
                <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Email</span><br>
                <strong style="color:#333;font-size:15px;">${toEmail}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #e0e0e0;">
                <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</span><br>
                <strong style="color:#333;font-size:15px;font-family:monospace;">${password}</strong>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 16px;">
                <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Your Role</span><br>
                <strong style="color:#1976d2;font-size:14px;">${roleDesc}</strong>
              </td>
            </tr>
          </table>

          <!-- Warning -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3e0;border:1px solid #ffcc02;border-radius:6px;margin-bottom:24px;">
            <tr>
              <td style="padding:12px 16px;">
                <strong style="color:#e65100;">⚠ Important:</strong>
                <span style="color:#bf360c;"> Please change your password after your first login for security.</span>
              </td>
            </tr>
          </table>

          <p style="color:#555;margin:0 0 8px;">If you have any questions about your account or the proceedings, please contact your case administrator.</p>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #e0e0e0;">
          <p style="margin:0;font-size:12px;color:#999;">This is an automated message from the Arbitration Platform. Please do not reply to this email.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

    try {
      await this.transporter.sendMail({
        from: `"Arbitration Platform" <${this.from}>`,
        to: toEmail,
        bcc: this.from,
        subject: 'Your Arbitration Platform Account — Login Credentials',
        html
      });
      console.log(`Welcome email sent to ${toEmail}`);
      return { sent: true };
    } catch (err) {
      console.error(`Failed to send email to ${toEmail}:`, err.message);
      return { sent: false, error: err.message };
    }
  }

  async sendAgreementForSigningEmail({ toEmails = [], subject, message, fileName, pdfBase64, caseId }) {
    if (!this.enabled) {
      console.warn(`Agreement email not sent to ${toEmails.join(', ')} — email service not configured`);
      return { sent: false };
    }

    const recipients = Array.isArray(toEmails) ? toEmails.filter(Boolean) : String(toEmails || '')
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      return { sent: false, error: 'No recipient email addresses provided' };
    }

    const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:#1976d2;padding:28px 32px;">
            <h1 style="margin:0;color:#fff;font-size:22px;">Arbitration Platform</h1>
            <p style="margin:6px 0 0;color:#bbdefb;font-size:14px;">Agreement ready for signing${caseId ? ` - Case ${caseId}` : ''}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:16px;color:#333;">Dear Recipient,</p>
            <p style="margin:0 0 18px;color:#555;">${message || 'Please review, sign, and return the attached arbitration agreement through the platform.'}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;">
                  <span style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;">Attachment</span><br>
                  <strong style="color:#333;font-size:15px;">${fileName || 'Arbitration Agreement.pdf'}</strong>
                </td>
              </tr>
            </table>
            <p style="color:#555;margin:0;">Once signed, please upload the completed copy back to the platform or return it by email so the case record can be updated.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
      const attachmentBuffer = Buffer.from(String(pdfBase64 || ''), 'base64');
      await this.transporter.sendMail({
        from: `"Arbitration Platform" <${this.from}>`,
        to: recipients.join(', '),
        bcc: this.from,
        subject: subject || 'Agreement for signing',
        html,
        attachments: [
          {
            filename: fileName || 'arbitration-agreement.pdf',
            content: attachmentBuffer,
            contentType: 'application/pdf'
          }
        ]
      });
      console.log(`Agreement template email sent to ${recipients.join(', ')}`);
      return { sent: true, recipients };
    } catch (err) {
      console.error(`Failed to send agreement email:`, err.message);
      return { sent: false, error: err.message };
    }
  }
  async _send({ to, subject, html }) {
    if (!this.enabled) return { sent: false };
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (!recipients.length) return { sent: false };
    try {
      await this.transporter.sendMail({
        from: `"Arbitration Platform" <${this.from}>`,
        to: recipients.join(', '),
        bcc: this.from,
        subject,
        html,
      });
      return { sent: true };
    } catch (err) {
      console.error(`Email error (${subject}):`, err.message);
      return { sent: false, error: err.message };
    }
  }

  async sendCaseCreated({ toEmails, caseTitle, caseId, claimant, respondent, arbitrator, seat }) {
    return this._send({
      to: toEmails,
      subject: `New Case Filed — ${caseTitle || caseId}`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <tr><td style="background:#1976d2;padding:28px 32px;">
        <h1 style="margin:0;color:#fff;font-size:22px;">Arbitration Platform</h1>
        <p style="margin:6px 0 0;color:#bbdefb;font-size:14px;">New case filed${caseId ? ` — ${caseId}` : ''}</p>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:#333;">A new arbitration case has been filed on the platform.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:24px;">
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Case Title</span><br><strong style="color:#333;">${caseTitle || '—'}</strong></td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Claimant</span><br><strong style="color:#333;">${claimant || '—'}</strong></td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Respondent</span><br><strong style="color:#333;">${respondent || '—'}</strong></td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Arbitrator</span><br><strong style="color:#333;">${arbitrator || 'To be appointed'}</strong></td></tr>
          <tr><td style="padding:10px 16px;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Seat</span><br><strong style="color:#333;">${seat || '—'}</strong></td></tr>
        </table>
        <p style="color:#555;">Log in to the platform to review the full case details and next steps.</p>
      </td></tr>
      <tr><td style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #e0e0e0;">
        <p style="margin:0;font-size:12px;color:#999;">Automated notification from Arbitration Platform. Do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`,
    });
  }

  async sendDocumentUploaded({ toEmails, caseTitle, caseId, documentName, uploadedBy, category }) {
    return this._send({
      to: toEmails,
      subject: `Document Uploaded — ${caseTitle || caseId}`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <tr><td style="background:#1976d2;padding:28px 32px;">
        <h1 style="margin:0;color:#fff;font-size:22px;">Arbitration Platform</h1>
        <p style="margin:6px 0 0;color:#bbdefb;font-size:14px;">New document — ${caseTitle || caseId}</p>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:#333;">A document has been uploaded to your case.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:24px;">
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Document</span><br><strong style="color:#333;">${documentName || '—'}</strong></td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Category</span><br><strong style="color:#333;">${category || '—'}</strong></td></tr>
          <tr><td style="padding:10px 16px;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Uploaded By</span><br><strong style="color:#333;">${uploadedBy || '—'}</strong></td></tr>
        </table>
        <p style="color:#555;">Log in to view, download, or respond to this document.</p>
      </td></tr>
      <tr><td style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #e0e0e0;">
        <p style="margin:0;font-size:12px;color:#999;">Automated notification from Arbitration Platform. Do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`,
    });
  }

  async sendHearingScheduled({ toEmails, caseTitle, caseId, hearingDate, hearingTime, location, hearingType, notes }) {
    return this._send({
      to: toEmails,
      subject: `Hearing Scheduled — ${caseTitle || caseId}`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <tr><td style="background:#1976d2;padding:28px 32px;">
        <h1 style="margin:0;color:#fff;font-size:22px;">Arbitration Platform</h1>
        <p style="margin:6px 0 0;color:#bbdefb;font-size:14px;">Hearing notice — ${caseTitle || caseId}</p>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:#333;">A hearing has been scheduled for your case.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:24px;">
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Date</span><br><strong style="color:#333;">${hearingDate || '—'}</strong></td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Time</span><br><strong style="color:#333;">${hearingTime || '—'}</strong></td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Location / Platform</span><br><strong style="color:#333;">${location || '—'}</strong></td></tr>
          <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e0e0;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Hearing Type</span><br><strong style="color:#333;">${hearingType || '—'}</strong></td></tr>
          ${notes ? `<tr><td style="padding:10px 16px;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Notes</span><br><span style="color:#555;">${notes}</span></td></tr>` : ''}
        </table>
        <p style="color:#555;">Please ensure all submissions are filed before the hearing. Log in to the platform for full details.</p>
      </td></tr>
      <tr><td style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #e0e0e0;">
        <p style="margin:0;font-size:12px;color:#999;">Automated notification from Arbitration Platform. Do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`,
    });
  }

  async sendDeadlineReminder({ toEmails, caseTitle, caseId, deadlineDescription, dueDate }) {
    return this._send({
      to: toEmails,
      subject: `Deadline Reminder — ${caseTitle || caseId}`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
      <tr><td style="background:#e65100;padding:28px 32px;">
        <h1 style="margin:0;color:#fff;font-size:22px;">Arbitration Platform</h1>
        <p style="margin:6px 0 0;color:#ffccbc;font-size:14px;">Deadline reminder — ${caseTitle || caseId}</p>
      </td></tr>
      <tr><td style="padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;color:#333;">You have an upcoming deadline in your case.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff3e0;border:1px solid #ffcc02;border-radius:6px;margin-bottom:24px;">
          <tr><td style="padding:12px 16px;border-bottom:1px solid #ffcc02;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Deadline</span><br><strong style="color:#e65100;">${deadlineDescription || '—'}</strong></td></tr>
          <tr><td style="padding:12px 16px;"><span style="font-size:12px;color:#888;text-transform:uppercase;">Due Date</span><br><strong style="color:#e65100;">${dueDate || '—'}</strong></td></tr>
        </table>
        <p style="color:#555;">Please log in to the platform to submit any required documents or responses before this deadline.</p>
      </td></tr>
      <tr><td style="background:#f5f5f5;padding:16px 32px;border-top:1px solid #e0e0e0;">
        <p style="margin:0;font-size:12px;color:#999;">Automated notification from Arbitration Platform. Do not reply.</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>`,
    });
  }
}

module.exports = EmailService;
