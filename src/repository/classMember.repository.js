import pool from "../config/db.config.js";

// 1. Kiểm tra xem member đã có trong class chưa
export const findMemberInClass = async (classId, memberId) => {
  const query = `
    SELECT * 
    FROM class_members 
    WHERE class_id = $1 AND member_id = $2
  `;
  const { rows } = await pool.query(query, [classId, memberId]);
  return rows[0] || null;
};

// 2. Thêm member vào class
export const addMember = async (classId, memberId) => {
  const query = `
    INSERT INTO class_members (class_id, member_id) 
    VALUES ($1, $2)
    ON CONFLICT (class_id, member_id) DO NOTHING
    RETURNING id
  `;
  const { rows, rowCount } = await pool.query(query, [classId, memberId]);
  return rowCount > 0;
};

// 3. Lấy danh sách thành viên trong class kèm thông tin cơ bản từ bảng users
export const getMembersByClassId = async (classId) => {
  const query = `
    SELECT u.id, u.name, u.email, u.role, cm.joined_at
    FROM class_members cm
    JOIN users u ON cm.member_id = u.id
    WHERE cm.class_id = $1 AND u.is_active = TRUE
    ORDER BY cm.joined_at ASC
  `;
  const { rows } = await pool.query(query, [classId]);
  return rows;
};

// 4. Xoá member khỏi class
export const removeMember = async (classId, memberId) => {
  const query = `
    DELETE FROM class_members 
    WHERE class_id = $1 AND member_id = $2
  `;
  const { rowCount } = await pool.query(query, [classId, memberId]);
  return rowCount > 0;
};

// 5. Kiểm tra nhanh sự tồn tại của user trong class (dùng để chặn quyền truy cập)
export const isUserInClass = async (classId, userId) => {
  const query = `
    SELECT 1 
    FROM class_members 
    WHERE class_id = $1 AND member_id = $2
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [classId, userId]);
  return rows.length > 0;
};