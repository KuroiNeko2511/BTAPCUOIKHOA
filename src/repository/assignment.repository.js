import pool from "../config/db.config.js";

export const findActiveUser = async (id) => {
  const { rows } = await pool.query(
    "SELECT id, role FROM users WHERE id = $1 AND is_active = TRUE",
    [id],
  );
  return rows[0] || null;
};

export const findClass = async (id) => {
  const { rows } = await pool.query(
    "SELECT id, mentor_id FROM classes WHERE id = $1",
    [id],
  );
  return rows[0] || null;
};

export const isClassMember = async (classId, memberId) => {
  const { rows } = await pool.query(
    `SELECT id FROM class_members
     WHERE class_id = $1 AND member_id = $2`,
    [classId, memberId],
  );
  return rows.length > 0;
};

export const listAssignments = async (classId) => {
  const { rows } = await pool.query(
    `SELECT * FROM assignments
     WHERE class_id = $1
     ORDER BY created_at DESC, id DESC`,
    [classId],
  );
  return rows;
};

export const findAssignment = async (id) => {
  const { rows } = await pool.query(
    `SELECT a.*,
            (a.deadline IS NOT NULL
             AND a.deadline < CURRENT_TIMESTAMP) AS is_closed
     FROM assignments a
     WHERE a.id = $1`,
    [id],
  );
  return rows[0] || null;
};

export const createAssignment = async (classId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO assignments
       (class_id, title, description, deadline, maximum_score)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [classId, data.title, data.description, data.deadline, data.maximumScore],
  );
  return findAssignment(rows[0].id);
};

export const hasSubmissions = async (assignmentId) => {
  const { rows } = await pool.query(
    "SELECT id FROM submissions WHERE assignment_id = $1 LIMIT 1",
    [assignmentId],
  );
  return rows.length > 0;
};

export const updateAssignment = async (id, data) => {
  await pool.query(
    `UPDATE assignments
     SET title = $1,
         description = $2,
         deadline = $3,
         maximum_score = $4
     WHERE id = $5`,
    [data.title, data.description, data.deadline, data.maximumScore, id],
  );

  return findAssignment(id);
};

export const deleteAssignment = async (id) => {
  await pool.query("DELETE FROM assignments WHERE id = $1", [id]);
};

export const createSubmission = async (assignmentId, memberId, data) => {
  const { rows } = await pool.query(
    `INSERT INTO submissions
       (assignment_id, member_id, content, repository_url)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [assignmentId, memberId, data.content, data.repositoryUrl],
  );
  return findSubmission(rows[0].id);
};

export const listSubmissions = async (assignmentId, memberId = null) => {
  const params = [assignmentId];

  let sql = `
    SELECT s.*, u.name AS member_name
    FROM submissions s
    JOIN users u ON u.id = s.member_id
    WHERE s.assignment_id = $1
  `;

  if (memberId !== null) {
    sql += " AND s.member_id = $2";
    params.push(memberId);
  }

  sql += " ORDER BY s.submitted_at DESC, s.id DESC";

  const { rows } = await pool.query(sql, params);

  return rows;
};

export const findSubmission = async (id) => {
  const { rows } = await pool.query("SELECT * FROM submissions WHERE id = $1", [
    id,
  ]);
  return rows[0] || null;
};

export const reviewSubmission = async (id, reviewerId, data) => {
  await pool.query(
    `UPDATE submissions
     SET score = $1,
         feedback = $2,
         reviewed_at = CURRENT_TIMESTAMP,
         reviewed_by = $3
     WHERE id = $4`,
    [data.score, data.feedback, reviewerId, id],
  );

  return findSubmission(id);
};
