// src/repository/user.repository.js
import pool from "../config/db.config.js";

export const findAll = async ({ sortBy = "id", order = "asc" }) => {
  const validSortColumns = ["id", "name", "email", "role", "created_at"];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "id";

  const validOrder = ["asc", "desc"];
  const sortOrder = validOrder.includes(order.toLowerCase())
    ? order.toLowerCase()
    : "asc";

  const [rows] = await pool.query(
    `SELECT id, name, email, role, is_active, created_at, updated_at 
     FROM users 
     WHERE is_active = TRUE 
     ORDER BY ${sortColumn} ${sortOrder}`,
  );
  return rows;
};

export const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, is_active, created_at, updated_at 
     FROM users 
     WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
};

export const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ? AND is_active = TRUE",
    [email],
  );
  return rows[0] || null;
};

export const create = async ({ name, email, passwordHash, password, role }) => {

  const finalPasswordHash = passwordHash || password;

  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash, role, is_active) 
     VALUES (?, ?, ?, ?, TRUE)`,
    [name, email, finalPasswordHash, role || "MEMBER"],
  );
  return findById(result.insertId);
};

export const update = async (id, { name, email }) => {
  await pool.execute(
    `UPDATE users 
     SET name = COALESCE(?, name), 
         email = COALESCE(?, email) 
     WHERE id = ?`,
    [name ?? null, email ?? null, id],
  );
  return findById(id);
};

export const deleteById = async (id) => {
  const existingUser = await findById(id);
  if (!existingUser) return null;

  // Xóa mềm: đánh dấu is_active = FALSE
  await pool.execute("UPDATE users SET is_active = FALSE WHERE id = ?", [id]);
  return { ...existingUser, is_active: 0 };
};