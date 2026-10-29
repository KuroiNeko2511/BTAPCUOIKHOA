import pool from "../config/db.config.js";

// Kiểm tra xem member đã có trong class chưa
export const findMemberInClass = async (classId, memberId) => {
  const [rows] = await pool.execute(
    "SELECT * FROM class_members WHERE class_id = ? AND member_id = ?",
    [classId, memberId]
  );
  return rows[0] || null;
};

// Thêm member vào class
export const addMember = async (classId, memberId) => {
  const [result] = await pool.execute(
    "INSERT INTO class_members (class_id, member_id, joined_at) VALUES (?, ?, NOW())",
    [classId, memberId]
  );
  return result.affectedRows > 0;
};

// Lấy danh sách thành viên trong class kèm thông tin cơ bản từ bảng users
export const getMembersByClassId = async (classId) => {
  const [rows] = await pool.execute(
    `SELECT u.id, u.name, u.email, u.role, cm.joined_at
     FROM class_members cm
     JOIN users u ON cm.member_id = u.id
     WHERE cm.class_id = ? AND u.is_active = TRUE
     ORDER BY cm.joined_at ASC`,
    [classId]
  );
  return rows;
};

// Xoá member khỏi class
export const removeMember = async (classId, memberId) => {
  const [result] = await pool.execute(
    "DELETE FROM class_members WHERE class_id = ? AND member_id = ?",
    [classId, memberId]
  );
  return result.affectedRows > 0;
};