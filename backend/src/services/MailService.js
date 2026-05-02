const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail({ to, fname, resetUrl }) {
  const transport = createTransport();
  if (!transport) {
    throw new Error('Mail service is not configured');
  }

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Reset your CLMS password',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #16301f;">
        <h2 style="color: #009947; margin-bottom: 8px;">Reset your CLMS password</h2>
        <p>Hello ${fname || 'Parent'},</p>
        <p>We received a request to reset your password. Click the link below to continue:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#00b14f;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">
            Reset password
          </a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
        <p style="font-size:12px;color:#6b7f74;">This link will expire soon for security.</p>
      </div>
    `,
  });
}

async function sendAlertEmail({ to, fname, event, alertType = 'EXIT' }) {
  const transport = createTransport();
  if (!transport) {
    throw new Error('Mail service is not configured');
  }

  const lat = event.lat ?? event.latitude;
  const lon = event.lon ?? event.longitude;
  const { device_id, child_name, timestamp, battery_level, activity_type, timezone } = event;

  const formattedTime = DateTime.fromJSDate(timestamp)
    .setZone(timezone || 'UTC')
    .toLocaleString(DateTime.DATETIME_MED);

  const mapsLink =
    lat != null && lon != null
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
      : `${FRONTEND_URL.replace(/\/$/, '')}/dashboard`;

  const subject =
    alertType === 'OUT_OF_SIGNAL'
      ? `⚠️ CLMS: ${child_name || 'Device'} — signal lost`
      : alertType === 'EXIT'
        ? `⚠️ Alert: ${child_name || 'Device'} is Out of Zone`
        : `CLMS: ${child_name || 'Device'} alert`;

  const bodyIntro =
    alertType === 'OUT_OF_SIGNAL'
      ? `<p><strong>${child_name || 'Your device'}</strong> (${device_id}) has gone offline (no location ping). Last known update: <strong>${formattedTime}</strong>.</p>`
      : alertType === 'EXIT'
        ? `<p><strong>${child_name || 'Your device'}</strong> (${device_id}) has moved out of the designated Safe Zone at <strong>${formattedTime}</strong>.</p>`
        : `<p>Alert for <strong>${child_name || 'Your device'}</strong> (${device_id}) at <strong>${formattedTime}</strong>.</p>`;

  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #16301f;">
        <h2 style="color: #d9534f; margin-bottom: 8px;">Device Alert</h2>
        <p>Hello ${fname || 'Parent'},</p>
        ${bodyIntro}
        
        <div style="background-color: #fcf4f4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d9534f;">
            <p style="margin: 0 0 10px 0;"><strong>Current Status:</strong></p>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
                <li><strong>Activity:</strong> ${activity_type || 'Unknown'}</li>
                <li><strong>Battery:</strong> ${battery_level !== null ? battery_level + '%' : 'Unknown'}</li>
            </ul>
            <p style="margin: 15px 0 0 0;">
                <a href="${mapsLink}" target="_blank" style="display: inline-block; padding: 10px 15px; background-color: #d9534f; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    View Location on Map
                </a>
            </p>
        </div>

        <p>Please check your CLMS app immediately to ensure everything is safe.</p>
        <p style="font-size:12px;color:#6b7f74; margin-top: 30px;">This is an automated alert from CLMS.</p>
      </div>
    `,
  });
}


module.exports = { sendPasswordResetEmail, sendAlertEmail };
