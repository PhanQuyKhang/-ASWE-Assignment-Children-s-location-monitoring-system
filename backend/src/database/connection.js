require('dotenv').config();

const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL);


const testConnection = async () => {
  try {
    const result = await sql`SELECT version()`;
    console.log('Database connected successfully -- Hihi let me in!');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message, '-- Oh no, access denied!');
    return false;
  }
};

module.exports = { sql, testConnection };