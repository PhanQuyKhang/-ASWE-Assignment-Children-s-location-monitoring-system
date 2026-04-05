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
  // models/UserModel.js

static async getActiveDevices(userId) {
    try {
        const query = `
            SELECT device_id 
            FROM devices 
            WHERE user_id = ${userId}
        `;
        
        // 1. Ensure you are using 'sql.query' (or however your connection is exported)
        const result = await sql.query(query, [userId]);

        // 2. SAFETY CHECK: If result or result.rows is missing, return an empty array
        if (!result || !result.rows) {
            console.log("⚠️ No rows returned from database for user:", userId);
            return [];
        }

        // 3. Now it is safe to map
        return result.rows.map(row => row.device_id);
        
    } catch (error) {
        console.error("❌ Error fetching active devices from DB:", error);
        // Return an empty array so the WebSocket bouncer doesn't crash the whole server
        return []; 
    }
}
}

module.exports = User;
