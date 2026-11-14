import * as lessonRepository from "../repository/lesson.repository.js";
import * as classRepository from "../repository/class.repository.js";
import { parsePositiveInt } from "../utils/validators.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from "../core/error.response.js";

// Hàm hỗ trợ lọc field update hợp lệ
const pickLessonUpdates = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new BadRequestError("Please check your information and try again.");
  }
  const allowedFields = ["title", "content", "orderIndex"];
  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }
  return updateData;
};

// 1. Tạo bài học (Chỉ Admin hoặc Mentor của lớp)
export const createLesson = async (data, user) => {
  const classId = parsePositiveInt(data.classId, "Class ID");

  const classInfo = await classRepository.findById(classId);
  if (!classInfo) throw new NotFoundError("Class not found.");

  if (user.role !== "ADMIN") {
    const isMentor = await classRepository.isMentorOfClass(classId, user.id);
    if (!isMentor) {
      throw new ForbiddenError("Chỉ Mentor của lớp mới được tạo bài học!");
    }
  }

  return lessonRepository.createLesson({
    classId,
    title: data.title?.trim(),
    content: data.content,
    orderIndex: data.orderIndex,
    createdBy: user.id,
  });
};

// 2. Xem danh sách bài học trong lớp (Admin, Mentor lớp hoặc Học viên trong lớp)
export const getLessonsByClass = async (classId, user) => {
  const id = parsePositiveInt(classId, "Class ID");
  const classInfo = await classRepository.findById(id);
  if (!classInfo) throw new NotFoundError("Class not found.");

  if (user.role !== "ADMIN") {
    const hasAccess = await classRepository.isMemberOrMentorOfClass(id, user.id);
    if (!hasAccess) {
      throw new ForbiddenError("Bạn không thuộc lớp học này!");
    }
  }

  return lessonRepository.findLessonsByClassId(id);
};

// 3. Xem chi tiết 1 bài học
export const getLessonById = async (lessonId, user) => {
  const id = parsePositiveInt(lessonId, "Lesson ID");
  const lesson = await lessonRepository.findLessonById(id);
  if (!lesson) throw new NotFoundError("Lesson not found!");

  if (user.role !== "ADMIN") {
    const hasAccess = await classRepository.isMemberOrMentorOfClass(
      lesson.class_id,
      user.id
    );
    if (!hasAccess) {
      throw new ForbiddenError("Bạn không thuộc lớp học này!");
    }
  }

  return lesson;
};

// 4. Cập nhật bài học (Chỉ Admin hoặc Mentor của lớp)
export const updateLesson = async (lessonId, data, user) => {
  const id = parsePositiveInt(lessonId, "Lesson ID");
  const lesson = await lessonRepository.findLessonById(id);
  if (!lesson) throw new NotFoundError("Lesson not found!");

  if (user.role !== "ADMIN") {
    const isMentor = await classRepository.isMentorOfClass(
      lesson.class_id,
      user.id
    );
    if (!isMentor) {
      throw new ForbiddenError("Chỉ Mentor của lớp mới được sửa bài học!");
    }
  }

  const updateData = pickLessonUpdates(data);
  if (updateData.title !== undefined) {
    updateData.title = updateData.title.trim();
  }

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError("No valid fields to update!");
  }

  return lessonRepository.updateLesson(id, updateData);
};

// 5. Xóa bài học (Chỉ Admin hoặc Mentor của lớp)
export const deleteLesson = async (lessonId, user) => {
  const id = parsePositiveInt(lessonId, "Lesson ID");
  const lesson = await lessonRepository.findLessonById(id);
  if (!lesson) throw new NotFoundError("Lesson not found!");

  if (user.role !== "ADMIN") {
    const isMentor = await classRepository.isMentorOfClass(
      lesson.class_id,
      user.id
    );
    if (!isMentor) {
      throw new ForbiddenError("Chỉ Mentor của lớp mới được xóa bài học!");
    }
  }

  return lessonRepository.deleteLesson(id);
};

// 6. Đánh dấu hoàn thành bài học (Chỉ học viên thuộc lớp chứa bài học đó)
export const completeLesson = async (lessonId, user) => {
  const id = parsePositiveInt(lessonId, "Lesson ID");
  const lesson = await lessonRepository.findLessonById(id);
  if (!lesson) throw new NotFoundError("Lesson not found!");

  const isMember = await classRepository.isMemberOfClass(
    lesson.class_id,
    user.id
  );
  if (!isMember) {
    throw new ForbiddenError(
      "Chỉ học viên thuộc lớp học này mới được đánh dấu hoàn thành bài học!"
    );
  }

  const progress = await lessonRepository.markCompleted(id, user.id);
  if (!progress) {
    throw new ConflictError("Lesson has already been marked as completed.");
  }

  return {
    message: "Lesson completed successfully!",
    data: progress,
  };
};

// 7. Xem tiến độ học tập
export const getClassProgress = async (classId, user) => {
  const id = parsePositiveInt(classId, "Class ID");
  const classInfo = await classRepository.findById(id);
  if (!classInfo) throw new NotFoundError("Class not found.");

  if (user.role !== "ADMIN") {
    const hasAccess = await classRepository.isMemberOrMentorOfClass(id, user.id);
    if (!hasAccess) {
      throw new ForbiddenError("Bạn không thuộc lớp học này!");
    }
  }

  const stats = await lessonRepository.getProgressStats(id, user.id);
  const progress =
    stats.totalLessons > 0
      ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
      : 0;

  return {
    totalLessons: stats.totalLessons,
    completedLessons: stats.completedLessons,
    progress: `${progress}%`,
  };
};