import pg from "pg";
import { config } from "./env.config.js";

const { Pool } = pg;

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 10,
});

export const connectDB = async () => {
  try {
    const connection = await pool.connect();
    console.log("Connected to PostgreSQL successfully!");
    connection.release();
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error.message);
    process.exit(1);
  }
};

export const query = (text, params) => pool.query(text, params);
export default pool;