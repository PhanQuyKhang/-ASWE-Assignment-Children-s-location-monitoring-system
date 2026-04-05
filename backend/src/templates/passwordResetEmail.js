function passwordResetEmail({ resetUrl, fname }) {
  return `
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
  `;
}

module.exports = { passwordResetEmail };
