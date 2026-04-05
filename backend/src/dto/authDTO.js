const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignupPayload(data) {
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const fname = String(data.fname || '').trim();
  const lname = String(data.lname || '').trim();
  const phone = data.phone ? String(data.phone).trim() : null;

  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid signup: email is not valid');
  }

  if (password.length < 8) {
    throw new Error('Invalid signup: password must be at least 8 characters');
  }

  if (!fname || !lname) {
    throw new Error('Invalid signup: first name and last name are required');
  }

  return { email, password, fname, lname, phone };
}

function validateLoginPayload(data) {
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');

  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid login: email is not valid');
  }

  if (!password) {
    throw new Error('Invalid login: password is required');
  }

  return { email, password };
}

function validateProfilePayload(data) {
  const fname = String(data.fname || '').trim();
  const lname = String(data.lname || '').trim();
  const phone = data.phone ? String(data.phone).trim() : null;

  if (!fname || !lname) {
    throw new Error('Invalid profile: first name and last name are required');
  }

  if (phone && phone.length > 20) {
    throw new Error('Invalid profile: phone is too long');
  }

  return { fname, lname, phone };
}

function validatePasswordResetRequestPayload(data) {
  const email = String(data.email || '').trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid email');
  }

  return { email };
}

function validatePasswordResetConfirmPayload(data) {
  const token = String(data.token || '').trim();
  const password = String(data.password || '');

  if (!token) {
    throw new Error('Reset token is required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  return { token, password };
}

function validateChangePasswordPayload(data) {
  const newPassword = String(data.newPassword || '');

  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }

  return { newPassword };
}

function validateGoogleLoginPayload(data) {
  const idToken = String(data.idToken || '').trim();

  if (!idToken) {
    throw new Error('Google token is required');
  }

  return { idToken };
}

module.exports = {
  validateSignupPayload,
  validateLoginPayload,
  validateProfilePayload,
  validatePasswordResetRequestPayload,
  validatePasswordResetConfirmPayload,
  validateChangePasswordPayload,
  validateGoogleLoginPayload,
};
