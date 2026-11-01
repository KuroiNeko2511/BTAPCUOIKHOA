// src/repository/user.repository.js
import pool from "../config/db.config.js";

export const findAll = async ({ sortBy = "id", order = "asc" }) => {
  const validSortColumns = ["id", "name", "email", "role", "created_at"];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "id";

  const validOrder = ["asc", "desc"];
  const sortOrder = validOrder.includes(order.toLowerCase())
    ? order.toLowerCase()
    : "asc";

  const { rows } = await pool.query(
    `SELECT id, name, email, role, is_active, created_at, updated_at 
     FROM users 
     WHERE is_active = TRUE 
     ORDER BY ${sortColumn} ${sortOrder}`,
  );
  return rows;
};

export const findById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, name, email, role, is_active, created_at, updated_at 
     FROM users 
     WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
};

export const findByEmail = async (email) => {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1 AND is_active = TRUE",
    [email],
  );
  return rows[0] || null;
};

export const create = async ({
  name,
  email,
  passwordHash,
  role = "MEMBER",
}) => {
  const { rows } = await pool.query(
    `INSERT INTO users
       (name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING id`,
    [name, email, passwordHash, role],
  );

  return findById(rows[0].id);
};

export const update = async (id, { name, email }) => {
  await pool.query(
    `UPDATE users 
     SET name = COALESCE($1, name), 
         email = COALESCE($2, email) 
     WHERE id = $3`,
    [name ?? null, email ?? null, id],
  );
  return findById(id);
};

export const deleteById = async (id) => {
  const existingUser = await findById(id);
  if (!existingUser) return null;

  // Xóa mềm: đánh dấu is_active = FALSE
  await pool.query("UPDATE users SET is_active = FALSE WHERE id = $1", [id]);
  return { ...existingUser, is_active: false };
};
