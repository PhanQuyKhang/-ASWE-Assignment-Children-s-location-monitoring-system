const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRY || '7d';
const JWT_SECRET = process.env.JWT_SECRET || 'clms-dev-secret-change-me';

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
      user,
    };
  },

  login: async (payload) => {
    const userWithPassword = await UserModel.findByEmail(payload.email);
    if (!userWithPassword) {
      throw createError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      userWithPassword.password
    );

    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    const safeUser = {
      user_id: userWithPassword.user_id,
      email: userWithPassword.email,
      fname: userWithPassword.fname,
      lname: userWithPassword.lname,
      phone: userWithPassword.phone,
    };

    return {
      token: signToken(safeUser),
      user: safeUser,
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

  logout: async () => {
    return { success: true };
  },
};

module.exports = AuthService;
