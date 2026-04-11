const { sql } = require('../database/connection');

class User {
  static async create(userData) {
    const { email, password, fname, lname, phone } = userData;

    const [result] = await sql`
      INSERT INTO users (email, password, fname, lname, phone)
      VALUES (${email}, ${password}, ${fname}, ${lname}, ${phone})
      RETURNING user_id, email, fname, lname, phone
    `;

    return result || null;
  }

  static async findByEmail(email) {
    const [result] = await sql`
      SELECT user_id, email, password, fname, lname, phone
      FROM users
      WHERE email = ${email}
    `;

    return result || null;
  }

  static async findById(userId) {
    const [result] = await sql`
      SELECT user_id, email, fname, lname, phone
      FROM users
      WHERE user_id = ${userId}
    `;

    return result || null;
  }

  static async findByIdWithPassword(userId) {
    const [result] = await sql`
      SELECT user_id, email, password, fname, lname, phone
      FROM users
      WHERE user_id = ${userId}
    `;

    return result || null;
  }

  static async updateProfile(userId, data) {
    const { fname, lname, phone } = data;

    const [result] = await sql`
      UPDATE users
      SET fname = ${fname},
          lname = ${lname},
          phone = ${phone}
      WHERE user_id = ${userId}
      RETURNING user_id, email, fname, lname, phone
    `;

    return result || null;
  }

  static async updatePassword(userId, password) {
    const [result] = await sql`
      UPDATE users
      SET password = ${password}
      WHERE user_id = ${userId}
      RETURNING user_id, email, fname, lname, phone
    `;

    return result || null;
  }
}

module.exports = User;
