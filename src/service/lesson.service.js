import * as lessonRepository from "../repository/lesson.repository.js";
import * as classRepository from "../repository/class.repository.js";

import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from "../core/error.response.js";
//ensureClassAccess: kiểm tra quyền truy cập của người dùng vào lớp học
const ensureClassAccess = async (classId, user, permission = "VIEW") => {
  if (user.role === "ADMIN") return;

  let hasAccess = false;

  if (permission === "MANAGE") {
    hasAccess = await classRepository.isMentorOfClass(classId, user.id);
  } else if (permission === "VIEW") {
    hasAccess = await classRepository.isMemberOrMentorOfClass(classId, user.id);
  } else {
    throw new Error("Invalid permission");
  }

  if (!hasAccess) {
    throw new ForbiddenError(
      "You do not have permission to access this class!",
    );
  }
};
//getLessonWithAccess: kiểm tra quyền truy cập của người dùng vào bài học
const getLessonWithAccess = async (lessonId, user, permission = "VIEW") => {
  const lesson = await lessonRepository.findLessonById(lessonId);

  if (!lesson) {
    throw new NotFoundError("Lesson not found!");
  }

  await ensureClassAccess(lesson.class_id, user, permission);

  return lesson;
};
//pickLessonUpdates: lọc dữ liệu cập nhật bài học
const pickLessonUpdates = (data) => {
  const allowedFields = ["title", "content", "orderIndex"];

  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  return updateData;
};

export const createLesson = async (data, user) => {
  const { classId, title, content, orderIndex } = data;

  await ensureClassAccess(classId, user, "MANAGE");

  return lessonRepository.createLesson({
    classId,
    title,
    content,
    orderIndex,
    createdBy: user.id,
  });
};

export const getLessonsByClass = async (classId, user) => {
  await ensureClassAccess(classId, user, "VIEW");

  return lessonRepository.findLessonsByClassId(classId);
};

export const getLessonById = async (lessonId, user) => {
  return getLessonWithAccess(lessonId, user, "VIEW");
};

export const updateLesson = async (lessonId, data, user) => {
  await getLessonWithAccess(lessonId, user, "MANAGE");

  const updateData = pickLessonUpdates(data);

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError("No valid fields to update!");
  }

  return lessonRepository.updateLesson(lessonId, updateData);
};

export const deleteLesson = async (lessonId, user) => {
  await getLessonWithAccess(lessonId, user, "MANAGE");

  return lessonRepository.deleteLesson(lessonId);
};

export const completeLesson = async (lessonId, user) => {
  await getLessonWithAccess(lessonId, user, "VIEW");

  const existing = await lessonRepository.findProgress(lessonId, user.id);

  if (existing) {
    throw new ConflictError("Lesson has already been marked as completed!");
  }

  await lessonRepository.markCompleted(lessonId, user.id);

  return {
    message: "Lesson completed successfully!",
  };
};

export const getClassProgress = async (classId, user) => {
  await ensureClassAccess(classId, user, "VIEW");

  const stats = await lessonRepository.getProgressStats(classId, user.id);

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
