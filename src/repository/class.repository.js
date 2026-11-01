import pool from "../config/db.config.js";

// 1. Tạo lớp học mới (Admin)
export const insertClass = async (classData) => {
  const { name, description, startDate, endDate, mentorId } = classData;
  const query = `
    INSERT INTO classes (name, description, start_date, end_date, mentor_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, description, status, start_date, end_date, mentor_id, created_at, updated_at
  `;
  const { rows } = await pool.query(query, [
    name,
    description ?? null,
    startDate ?? null,
    endDate ?? null,
    mentorId,
  ]);
  return rows[0].id;
};

// 2. Tìm lớp theo ID (kèm thông tin Mentor)
export const findById = async (id) => {
  const query = `
    SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, 
           c.mentor_id, u.name AS mentor_name, c.created_at, c.updated_at
    FROM classes c
    LEFT JOIN users u ON c.mentor_id = u.id
    WHERE c.id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

// 3. Lấy tất cả lớp học cho Admin
export const findAllClassesForAdmin = async () => {
  const query = `
    SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, 
           c.mentor_id, u.name AS mentor_name, c.created_at
    FROM classes c
    LEFT JOIN users u ON c.mentor_id = u.id
    ORDER BY c.created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// 4. Lấy danh sách lớp dành cho Member (Lớp đã tham gia hoặc do Member đó làm Mentor)
export const findClassesForMember = async (memberId) => {
  const query = `
    SELECT DISTINCT c.id, c.name, c.description, c.status, c.start_date, c.end_date, 
           c.mentor_id, u.name AS mentor_name, c.created_at
    FROM classes c
    LEFT JOIN class_members cm ON c.id = cm.class_id
    LEFT JOIN users u ON c.mentor_id = u.id
    WHERE cm.member_id = $1 OR c.mentor_id = $1
    ORDER BY c.created_at DESC
  `;
  const { rows } = await pool.query(query, [memberId]);
  return rows;
};

// 5. Cập nhật thông tin lớp học (Admin)
export const update = async (
  id,
  { name, description, startDate, endDate, mentorId }
) => {
  const query = `
    UPDATE classes 
    SET name = COALESCE($1, name),
        description = COALESCE($2, description),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        mentor_id = COALESCE($5, mentor_id)
    WHERE id = $6
    RETURNING id, name, description, status, start_date, end_date, mentor_id, created_at, updated_at
  `;
  const { rows } = await pool.query(query, [
    name ?? null,
    description ?? null,
    startDate ?? null,
    endDate ?? null,
    mentorId ?? null,
    id,
  ]);
  
  if (rows.length === 0) return null;
  return await findById(id);
};

// 6. Xóa lớp học (Admin)
export const deleteById = async (id) => {
  const existingClass = await findById(id);
  if (!existingClass) return null;

  const query = "DELETE FROM classes WHERE id = $1";
  await pool.query(query, [id]);
  return existingClass;
};

// 7. Kiểm tra user có phải Mentor hoặc Member của lớp hay không (Phục vụ phân quyền)
export const isMemberOrMentorOfClass = async (classId, userId) => {
  const query = `
    SELECT 1 
    FROM classes c 
    LEFT JOIN class_members cm ON c.id = cm.class_id AND cm.member_id = $1
    WHERE c.id = $2 AND (c.mentor_id = $1 OR cm.member_id = $1)
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [userId, classId]);
  return rows.length > 0;
};

// 8. Kiểm tra user có phải Mentor phụ trách lớp không
export const isMentorOfClass = async (classId, mentorId) => {
  const query = "SELECT id FROM classes WHERE id = $1 AND mentor_id = $2";
  const { rows } = await pool.query(query, [classId, mentorId]);
  return rows.length > 0;
};

// Tìm lớp học theo tên (không phân biệt hoa thường)
export const findByName = async (name) => {
  const query = `
    SELECT id, name, mentor_id 
    FROM classes 
    WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [name]);
  return rows[0] || null;
};