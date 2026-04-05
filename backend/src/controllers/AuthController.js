const {
  validateSignupPayload,
  validateLoginPayload,
  validateProfilePayload,
  validatePasswordResetRequestPayload,
  validatePasswordResetConfirmPayload,
  validateChangePasswordPayload,
} = require('../dto/authDTO');
const AuthService = require('../services/AuthService');

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'clms_access_token';

function getAuthCookieOptions() {
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: sevenDaysMs,
  };
}

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}

const AuthController = {
  signup: async (req, res) => {
    try {
      const data = validateSignupPayload(req.body);
      const result = await AuthService.signup(data);
      setAuthCookie(res, result.token);
      return res.status(201).json({ success: true, user: result.user });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const data = validateLoginPayload(req.body);
      const result = await AuthService.login(data);
      setAuthCookie(res, result.token);
      return res.json({ success: true, user: result.user });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  googleStart: async (req, res) => {
    try {
      const url = AuthService.getGoogleAuthUrl();
      return res.redirect(url);
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.message });
    }
  },

  googleCallback: async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ error: 'Missing Google authorization code' });
      }

      const result = await AuthService.loginWithGoogleCallback({ code });
      setAuthCookie(res, result.token);
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/dashboard`;
      return res.redirect(redirectUrl);
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  logout: async (req, res) => {
    try {
      await AuthService.logout();
      clearAuthCookie(res);
      return res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await AuthService.getProfile(req.user.user_id);
      return res.json({ success: true, user });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const data = validateProfilePayload(req.body);
      const user = await AuthService.updateProfile(req.user.user_id, data);
      return res.json({ success: true, user });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  changePassword: async (req, res) => {
    try {
      const data = validateChangePasswordPayload(req.body);
      await AuthService.changePassword(req.user.user_id, data);
      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  requestPasswordReset: async (req, res) => {
    try {
      const data = validatePasswordResetRequestPayload(req.body);
      await AuthService.requestPasswordReset(data);
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  confirmPasswordReset: async (req, res) => {
    try {
      const data = validatePasswordResetConfirmPayload(req.body);
      await AuthService.confirmPasswordReset(data);
      return res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },
};

module.exports = AuthController;
