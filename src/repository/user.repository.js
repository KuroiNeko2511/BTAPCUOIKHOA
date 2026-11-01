// src/repository/user.repository.js
import pool from "../config/db.config.js";

// 1. Lấy tất cả user đang active kèm sắp xếp an toàn
export const findAll = async ({ sortBy = "id", order = "asc" }) => {
  const validSortColumns = ["id", "name", "email", "role", "created_at"];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "id";

  const validOrder = ["asc", "desc"];
  const sortOrder = validOrder.includes(order.toLowerCase())
    ? order.toLowerCase()
    : "asc";

  const query = `
    SELECT id, name, email, role, is_active, created_at, updated_at 
    FROM users 
    WHERE is_active = TRUE 
    ORDER BY ${sortColumn} ${sortOrder}
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// 2. Tìm user theo ID
export const findById = async (id) => {
  const query = `
    SELECT id, name, email, role, is_active, created_at, updated_at 
    FROM users 
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

// 3. Tìm user theo Email (phục vụ Login / Kiểm tra trùng email)
export const findByEmail = async (email) => {
  const query = `
    SELECT * 
    FROM users 
    WHERE email = $1 AND is_active = TRUE
  `;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
};

// 4. Tạo user mới (Admin hoặc Đăng ký)
export const create = async ({ name, email, passwordHash, password, role }) => {
  const finalPasswordHash = passwordHash || password;

  const query = `
    INSERT INTO users (name, email, password_hash, role, is_active) 
    VALUES ($1, $2, $3, $4, TRUE) 
    RETURNING id, name, email, role, is_active, created_at, updated_at
  `;
  const { rows } = await pool.query(query, [
    name ?? null,
    email ?? null,
    finalPasswordHash,
    role || "MEMBER",
  ]);
  return rows[0];
};

// 5. Cập nhật thông tin user
export const update = async (id, { name, email }) => {
  const query = `
    UPDATE users 
    SET name = COALESCE($1, name), 
        email = COALESCE($2, email) 
    WHERE id = $3 
    RETURNING id, name, email, role, is_active, created_at, updated_at
  `;
  const { rows } = await pool.query(query, [name ?? null, email ?? null, id]);
  return rows[0] || null;
};

// 6. Xóa mềm user (Soft delete)
export const deleteById = async (id) => {
  const query = `
    UPDATE users 
    SET is_active = FALSE 
    WHERE id = $1 
    RETURNING id, name, email, role, is_active, created_at, updated_at
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};
