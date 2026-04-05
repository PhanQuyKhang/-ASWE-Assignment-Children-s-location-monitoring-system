const nodemailer = require('nodemailer');

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

module.exports = { sendPasswordResetEmail };
