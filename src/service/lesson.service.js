import * as lessonRepository from "../repository/lesson.repository.js";
import * as classRepository from "../repository/class.repository.js"; 
import { NotFoundError, ForbiddenError, ConflictError } from "../core/error.response.js";

// Helper kiểm tra member có trong lớp hoặc là mentor không
const ensureMemberInClass = async (classId, userId, role) => {
  // 1. Admin luôn có toàn quyền truy cập
  if (role === "ADMIN") return;

  // 2. Tái sử dụng hàm repository kiểm tra đồng thời cả Member lẫn Mentor
  const hasAccess = await classRepository.isMemberOrMentorOfClass(classId, userId);
  if (!hasAccess) {
    throw new ForbiddenError("Bạn không có quyền truy cập lớp học này!");
  }
};

export const createLesson = async ({ classId, title, content, orderIndex, userId }) => {
  return await lessonRepository.createLesson({ classId, title, content, orderIndex, createdBy: userId });
};

export const getLessonsByClass = async (classId, user) => {
  await ensureMemberInClass(classId, user.id, user.role);
  return await lessonRepository.findLessonsByClassId(classId);
};

export const getLessonById = async (lessonId, user) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) throw new NotFoundError("Bài học không tồn tại!");
  await ensureMemberInClass(lesson.class_id, user.id, user.role);
  return lesson;
};

export const updateLesson = async (id, data) => {
  return await lessonRepository.updateLesson(id, data);
};

export const deleteLesson = async (id) => {
  return await lessonRepository.deleteLesson(id);
};

export const completeLesson = async (lessonId, memberId, role) => {
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) throw new NotFoundError("Bài học không tồn tại!");
  await ensureMemberInClass(lesson.class_id, memberId, role);

  const existing = await lessonRepository.findProgress(lessonId, memberId);
  if (existing) {
    throw new ConflictError("Bài học này đã được đánh dấu hoàn thành từ trước!");
  }

  await lessonRepository.markCompleted(lessonId, memberId);
  return { message: "Hoàn thành bài học thành công!" };
};

export const getClassProgress = async (classId, user) => {
  await ensureMemberInClass(classId, user.id, user.role);
  const stats = await lessonRepository.getProgressStats(classId, user.id);
  const progress = stats.totalLessons > 0 
    ? Math.round((stats.completedLessons / stats.totalLessons) * 100) 
    : 0;

  return {
    totalLessons: stats.totalLessons,
    completedLessons: stats.completedLessons,
    progress: `${progress}%`,
  };
};