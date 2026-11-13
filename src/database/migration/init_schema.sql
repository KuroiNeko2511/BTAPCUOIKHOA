-- 1. TẠO CÁC ENUM TYPE CHO POSTGRESQL
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_status') THEN
        CREATE TYPE class_status AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBER');
    END IF;
END $$;

-- 2. TẠO HÀM TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. BẢNG USERS
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'MEMBER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- 4. BẢNG CLASSES
DROP TABLE IF EXISTS classes CASCADE;
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status class_status NOT NULL DEFAULT 'UPCOMING',
    start_date DATE,
    end_date DATE,
    mentor_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_classes_mentor FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_classes_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_classes_mentor_id ON classes(mentor_id);

CREATE TRIGGER trg_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- 5. BẢNG CLASS_MEMBERS
DROP TABLE IF EXISTS class_members CASCADE;
CREATE TABLE class_members (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_member UNIQUE (class_id, member_id),
    CONSTRAINT fk_cm_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_cm_member FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_class_members_member_id ON class_members(member_id);

-- 6. BẢNG LESSONS
DROP TABLE IF EXISTS lessons CASCADE;
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lesson_class_order UNIQUE (class_id, order_index),
    CONSTRAINT fk_lessons_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_lessons_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_lessons_class_id ON lessons(class_id);
CREATE INDEX fk_lessons_creator ON lessons(created_by);

CREATE TRIGGER trg_lessons_updated_at
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- 7. BẢNG LESSON_PROGRESS
DROP TABLE IF EXISTS lesson_progress CASCADE;
CREATE TABLE lesson_progress (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lesson_member_progress UNIQUE (lesson_id, member_id),
    CONSTRAINT fk_lp_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    CONSTRAINT fk_lp_member FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_lesson_progress_member_id ON lesson_progress(member_id);

-- 8. BẢNG ASSIGNMENTS
DROP TABLE IF EXISTS assignments CASCADE;
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline TIMESTAMP DEFAULT NULL,
    maximum_score NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignments_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT chk_assignments_max_score CHECK (maximum_score > 0)
);

CREATE INDEX idx_assignments_class_id ON assignments(class_id);

CREATE TRIGGER trg_assignments_updated_at
BEFORE UPDATE ON assignments
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- 9. BẢNG SUBMISSIONS
DROP TABLE IF EXISTS submissions CASCADE;
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    content TEXT,
    repository_url VARCHAR(500) DEFAULT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    score NUMERIC(5, 2) DEFAULT NULL,
    feedback TEXT,
    reviewed_at TIMESTAMP DEFAULT NULL,
    reviewed_by INTEGER DEFAULT NULL,
    CONSTRAINT uq_assignment_member_submission UNIQUE (assignment_id, member_id),
    CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_member FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_submissions_score CHECK (score IS NULL OR score >= 0)
);

CREATE INDEX idx_submissions_member_id ON submissions(member_id);
CREATE INDEX fk_submissions_reviewer ON submissions(reviewed_by);