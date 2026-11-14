import bcrypt from "bcrypt";
import pool from "../../config/db.config.js";

export const runSeed = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Seed tài khoản Super Admin
    const adminEmail = "admin@gmail.com";
    const adminCheck = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [adminEmail]
    );

    if (adminCheck.rows.length === 0) {
      const adminHash = await bcrypt.hash("admin123", 10);
      await client.query(
        `INSERT INTO users (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'ADMIN', TRUE)`,
        ["Super Administrator", adminEmail, adminHash]
      );
      console.log("✅ Đã tạo tài khoản Admin: admin@gmail.com / admin123");
    }

    // 2. Seed danh sách user1 -> user6 (mật khẩu chung: user123)
    const memberHash = await bcrypt.hash("user123", 10);
    const values = [];
    const placeholders = [];

    for (let i = 1; i <= 6; i++) {
      const name = `user${i}`;
      const email = `user${i}@gmail.com`;
      const offset = (i - 1) * 4;

      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, TRUE)`
      );
      values.push(name, email, memberHash, "MEMBER");
    }

    await client.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ${placeholders.join(", ")}
       ON CONFLICT (email) DO NOTHING`,
      values
    );

    // Lấy danh sách user1 -> user6 vừa tạo (hoặc đã tồn tại) để lấy đúng ID
    const { rows: seededUsers } = await client.query(
      `SELECT id, name, email FROM users 
       WHERE email IN ('user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com', 'user4@gmail.com', 'user5@gmail.com', 'user6@gmail.com')
       ORDER BY email ASC`
    );

    const userMap = Object.fromEntries(seededUsers.map((u) => [u.name, u.id]));

    // 3. Seed 2 lớp học mẫu (user1 làm Mentor lớp 1, user2 làm Mentor lớp 2)
    const sampleClasses = [
      {
        name: "BE Basic - Batch 01",
        description: "Khóa học lập trình Backend cơ bản với Node.js, Express và PostgreSQL.",
        startDate: "2026-11-01",
        endDate: "2027-01-31",
        mentorId: userMap["user1"],
        members: [userMap["user3"], userMap["user4"], userMap["user5"]],
      },
      {
        name: "FE Basic - Batch 01",
        description: "Khóa học lập trình Frontend cơ bản với HTML, CSS, JavaScript và React.",
        startDate: "2026-11-15",
        endDate: "2027-02-15",
        mentorId: userMap["user2"],
        members: [userMap["user4"], userMap["user5"], userMap["user6"]],
      },
    ];

    for (const cls of sampleClasses) {
      if (!cls.mentorId) continue;

      // Kiểm tra xem lớp đã tồn tại chưa để tránh tạo trùng khi chạy lại seed
      const existClass = await client.query(
        "SELECT id FROM classes WHERE name = $1",
        [cls.name]
      );

      let classId;
      if (existClass.rows.length === 0) {
        const insertedClass = await client.query(
          `INSERT INTO classes (name, description, start_date, end_date, mentor_id)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [cls.name, cls.description, cls.startDate, cls.endDate, cls.mentorId]
        );
        classId = insertedClass.rows[0].id;
        console.log(`✅ Đã tạo lớp: ${cls.name} (Mentor: user${cls.mentorId === userMap["user1"] ? 1 : 2})`);
      } else {
        classId = existClass.rows[0].id;
      }

      // Thêm học viên mẫu vào lớp
      for (const memberId of cls.members) {
        if (!memberId) continue;
        await client.query(
          `INSERT INTO class_members (class_id, member_id)
           VALUES ($1, $2)
           ON CONFLICT (class_id, member_id) DO NOTHING`,
          [classId, memberId]
        );
      }
    }

    await client.query("COMMIT");
    console.log("🎉 Hoàn tất quá trình Seed dữ liệu mẫu!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Lỗi khi chạy Seed:", error.message);
  } finally {
    client.release();
  }
};

if (
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith("src/database/seeds/seed.js")
) {
  runSeed().then(async () => {
    await pool.end();
    process.exit(0);
  });
}