import mysql from "mysql2/promise";
import { config } from "./env.config.js";

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to MySQL database successfully!");
    connection.release();
  } catch (error) {
    console.error("Failed to connect to MySQL database:", error.message);
    process.exit(1);
  }
};

export const query = (text, params) => pool.execute(text, params);
export default pool;