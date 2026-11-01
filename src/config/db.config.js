
import pg from "pg";
import config from "./env.config.js";

const { Pool } = pg;

if (!config.db.url) {
  throw new Error("DATABASE_URL chưa được cấu hình!");
}

// Kết nối đến Neon PostgreSQL
const pool = new Pool({
  connectionString: config.db.url,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

// Kiểm tra kết nối
export const connectDB = async () => {
  let connection;

  try {
    connection = await pool.connect();

    const result = await connection.query(`
      SELECT
        current_database() AS database_name,
        current_user AS username
    `);

    console.log("Connected to Neon PostgreSQL!");
    console.log("Database:", result.rows[0].database_name);
    console.log("User:", result.rows[0].username);

  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
    throw error;

  } finally {
    if (connection) connection.release();
  }
};

// Giữ nguyên để các Repository sử dụng
export const query = (text, params) =>
  pool.query(text, params);

export default pool;
