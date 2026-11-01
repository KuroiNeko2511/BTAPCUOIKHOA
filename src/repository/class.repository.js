import pool from "../config/db.config.js";

export const insertClass = async (classData) => {
  const { name, description, startDate, endDate, mentorId, menterId } = classData;
  const finalMentorId = mentorId || menterId;
  const { rows } = await pool.query(
  `INSERT INTO classes
     (name, description, start_date, end_date, mentor_id)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id`,
  [
    name,
    description ?? null,
    startDate ?? null,
    endDate ?? null,
    finalMentorId,
  ],
);

return rows[0].id;
};

export const findAllClassesForAdmin = async () => {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.description, c.start_date, c.end_date, 
            c.mentor_id, u.name as mentor_name, c.created_at
     FROM classes c
     LEFT JOIN users u ON c.mentor_id = u.id
     ORDER BY c.created_at DESC`,
  );
  return rows;
};

export const findClassesForMember = async (memberId) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, c.description, c.start_date, c.end_date, 
            c.mentor_id, u.name as mentor_name, c.created_at
     FROM classes c
     JOIN class_members cm ON c.id = cm.class_id
     LEFT JOIN users u ON c.mentor_id = u.id
     WHERE cm.member_id = $1
     ORDER BY c.created_at DESC`,
    [memberId],
  );
  return rows;
};
