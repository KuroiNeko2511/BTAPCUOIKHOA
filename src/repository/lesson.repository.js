import pool from "../config/db.config.js";

// 1. Tạo bài học mới (Mentor của lớp)
export const createLesson = async ({ classId, title, content, orderIndex, createdBy }) => {
  const query = `
    INSERT INTO lessons (class_id, title, content, order_index, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, class_id, title, content, order_index, created_by, created_at, updated_at
  `;
  const { rows } = await pool.query(query, [
    classId,
    title,
    content ?? null,
    orderIndex || 1,
    createdBy,
  ]);
  return rows[0];
};

// 2. Tìm bài học theo ID
export const findLessonById = async (id) => {
  const query = `
    SELECT l.*, u.name AS mentor_name 
    FROM lessons l
    JOIN users u ON l.created_by = u.id
    WHERE l.id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

// 3. Lấy toàn bộ bài học theo ID lớp học
export const findLessonsByClassId = async (classId) => {
  const query = `
    SELECT l.*, u.name AS mentor_name 
    FROM lessons l 
    JOIN users u ON l.created_by = u.id 
    WHERE l.class_id = $1 
    ORDER BY l.order_index ASC, l.id ASC
  `;
  const { rows } = await pool.query(query, [classId]);
  return rows;
};

// 4. Cập nhật bài học
export const updateLesson = async (id, { title, content, orderIndex }) => {
  const query = `
    UPDATE lessons 
    SET title = COALESCE($1, title),
        content = COALESCE($2, content),
        order_index = COALESCE($3, order_index)
    WHERE id = $4
    RETURNING id, class_id, title, content, order_index, created_by, created_at, updated_at
  `;
  const { rows } = await pool.query(query, [
    title ?? null,
    content ?? null,
    orderIndex ?? null,
    id,
  ]);
  return rows[0] || null;
};

// 5. Xóa bài học
export const deleteLesson = async (id) => {
  const query = `
    DELETE FROM lessons 
    WHERE id = $1 
    RETURNING id, class_id, title
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

// --- LESSON PROGRESS ---

// 6. Kiểm tra xem học viên đã hoàn thành bài học chưa
export const findProgress = async (lessonId, memberId) => {
  const query = `
    SELECT * 
    FROM lesson_progress 
    WHERE lesson_id = $1 AND member_id = $2
  `;
  const { rows } = await pool.query(query, [lessonId, memberId]);
  return rows[0] || null;
};

// 7. Đánh dấu bài học đã hoàn thành
export const markCompleted = async (lessonId, memberId) => {
  const query = `
    INSERT INTO lesson_progress (lesson_id, member_id) 
    VALUES ($1, $2)
    ON CONFLICT (lesson_id, member_id) DO NOTHING
    RETURNING id, lesson_id, member_id, completed_at
  `;
  const { rows } = await pool.query(query, [lessonId, memberId]);
  return rows[0] || null;
};

// 8. Đếm tổng số bài học và số bài học member đã hoàn thành trong lớp
export const getProgressStats = async (classId, memberId) => {
  const totalLessonsQuery = `
    SELECT COUNT(*)::int AS total 
    FROM lessons 
    WHERE class_id = $1
  `;
  const completedLessonsQuery = `
    SELECT COUNT(*)::int AS completed 
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    WHERE l.class_id = $1 AND lp.member_id = $2
  `;

  const [totalResult, completedResult] = await Promise.all([
    pool.query(totalLessonsQuery, [classId]),
    pool.query(completedLessonsQuery, [classId, memberId]),
  ]);

  return {
    totalLessons: totalResult.rows[0].total,
    completedLessons: completedResult.rows[0].completed,
  };
};