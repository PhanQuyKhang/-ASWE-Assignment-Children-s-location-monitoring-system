const {
  validateSignupPayload,
  validateLoginPayload,
  validateProfilePayload,
} = require('../dto/authDTO');
const AuthService = require('../services/AuthService');

const AuthController = {
  signup: async (req, res) => {
    try {
      const data = validateSignupPayload(req.body);
      const result = await AuthService.signup(data);
      return res.status(201).json({ success: true, ...result });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const data = validateLoginPayload(req.body);
      const result = await AuthService.login(data);
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(err.status || 400).json({ error: err.message });
    }
  },

  logout: async (req, res) => {
    try {
      await AuthService.logout();
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
};

module.exports = AuthController;
