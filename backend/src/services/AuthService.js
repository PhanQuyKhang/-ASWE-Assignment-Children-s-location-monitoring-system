const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const { sendPasswordResetEmail } = require('./MailService');
const { buildGoogleAuthUrl, exchangeGoogleCode } = require('./GoogleAuthService');
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRY || '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'clms-dev-secret-change-me';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET || JWT_SECRET;
const RESET_TOKEN_EXPIRES_IN = process.env.RESET_TOKEN_EXPIRES_IN || '30m';

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function signToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: 'PARENT',
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
}

function safeUser(user) {
  return {
    user_id: user.user_id,
    email: user.email,
    fname: user.fname,
    lname: user.lname,
    phone: user.phone,
  };
}

const AuthService = {
  signup: async (payload) => {
    const existingUser = await UserModel.findByEmail(payload.email);
    if (existingUser) {
      throw createError('Email is already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const user = await UserModel.create({
      ...payload,
      password: hashedPassword,
    });

    if (!user) {
      throw createError('Signup failed', 500);
    }

    return {
      token: signToken(user),
      user: safeUser(user),
    };
  },

  login: async (payload) => {
    const userWithPassword = await UserModel.findByEmail(payload.email);
    if (!userWithPassword) {
      throw createError('Invalid email or password', 401);
    }

    if (!userWithPassword.password) {
      throw createError('This account uses Google sign-in. Please continue with Google.', 401);
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      userWithPassword.password
    );

    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    return {
      token: signToken(userWithPassword),
      user: safeUser(userWithPassword),
    };
  },

  getGoogleAuthUrl: () => buildGoogleAuthUrl(),

  loginWithGoogleCallback: async ({ code }) => {
    const payload = await exchangeGoogleCode(code);

    if (!payload?.email || !payload?.sub) {
      throw createError('Invalid Google account payload', 401);
    }

    let user = await UserModel.findByEmail(payload.email.toLowerCase());

    const derivedName = payload.name || '';
    const nameParts = derivedName.trim().split(/\s+/).filter(Boolean);
    const fname = nameParts[0] || payload.given_name || 'Parent';
    const lname = nameParts.slice(1).join(' ') || payload.family_name || 'User';

    if (!user) {
      const created = await UserModel.create({
        email: payload.email.toLowerCase(),
        password: '',
        fname,
        lname,
        phone: null,
      });

      return {
        token: signToken(created),
        user: safeUser(created),
      };
    }

    return {
      token: signToken(user),
      user: safeUser(user),
    };
  },

  getProfile: async (userId) => {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    return user;
  },

  updateProfile: async (userId, payload) => {
    const updatedUser = await UserModel.updateProfile(userId, payload);
    if (!updatedUser) {
      throw createError('Profile update failed', 500);
    }

    return updatedUser;
  },

  changePassword: async (userId, { newPassword }) => {
    const userWithPassword = await UserModel.findByIdWithPassword(userId);
    if (!userWithPassword) {
      throw createError('User not found', 404);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(userId, hashedPassword);

    return { success: true };
  },

  logout: async () => {
    return { success: true };
  },

  requestPasswordReset: async ({ email }) => {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return { success: true };
    }

    const token = jwt.sign(
      {
        purpose: 'password_reset',
        email: user.email,
      },
      RESET_TOKEN_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES_IN }
    );

    const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail({
      to: user.email,
      fname: user.fname,
      resetUrl,
    });

    return { success: true };
  },

  confirmPasswordReset: async ({ token, password }) => {
    let payload;

    try {
      payload = jwt.verify(token, RESET_TOKEN_SECRET);
    } catch {
      throw createError('Reset token is invalid or expired', 400);
    }

    if (!payload || payload.purpose !== 'password_reset' || !payload.email) {
      throw createError('Reset token is invalid or expired', 400);
    }

    const user = await UserModel.findByEmail(payload.email);
    if (!user) {
      throw createError('User not found', 404);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.updatePassword(user.user_id, hashedPassword);

    return { success: true };
  },
};

module.exports = AuthService;
