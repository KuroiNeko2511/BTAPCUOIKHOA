import bcrypt from "bcrypt";
import pool from "../../config/db.config.js";

export const runSeed = async () => {
  const client = await pool.connect();
  try {
    const adminEmail = "admin@gmail.com";
    const plainPassword = "admin123";

    // Kiểm tra xem đã có admin chưa
    const checkQuery = "SELECT id FROM users WHERE email = $1";
    const { rows } = await client.query(checkQuery, [adminEmail]);

    if (rows.length > 0) {
      return;
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, 'ADMIN', TRUE)
      RETURNING id, name, email, role;
    `;
    const res = await client.query(insertQuery, [
      "Super Administrator",
      adminEmail,
      passwordHash,
    ]);
  } catch (error) {
    console.error("❌ Lỗi khi chạy Seed:", error.message);
  } finally {
    client.release();
  }
};

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("src/database/seeds/seed.js")) {
  runSeed().then(async () => {
    await pool.end();
    process.exit(0);
  });
}