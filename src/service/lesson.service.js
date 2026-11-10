import * as lessonRepository from "../repository/lesson.repository.js";
import * as classRepository from "../repository/class.repository.js";
import { parsePositiveInt } from "../utils/validators.js";
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from "../core/error.response.js";
import {
  validateLessonOrderIndex,
  validateLessonTitle,
  validateLessonContent,
} from "../middleware/validate.js";

//ensureClassAccess: kiểm tra quyền truy cập của người dùng vào lớp học
const ensureClassAccess = async (classId, user, permission = "VIEW") => {
  const id = parsePositiveInt(classId, "Class ID");
  const classInfo = await classRepository.findById(id);

  if (!classInfo) {
    throw new NotFoundError("Class not found.");
  }
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
  lessonId = parsePositiveInt(lessonId, "Lesson ID");
  const lesson = await lessonRepository.findLessonById(lessonId);
  if (!lesson) {
    throw new NotFoundError("Lesson not found!");
  }

  await ensureClassAccess(lesson.class_id, user, permission);

  return lesson;
};
//pickLessonUpdates: lọc dữ liệu cập nhật bài học
const pickLessonUpdates = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new BadRequestError("Please check your information and try again.");
  }
  const allowedFields = ["title", "content", "orderIndex"];

  const unsupportedFields = Object.keys(data).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unsupportedFields.length > 0) {
    throw new BadRequestError(
      `Unsupported fields: ${unsupportedFields.join(", ")}.`,
    );
  }

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

  const validatedTitle = validateLessonTitle(title);
  const validatedContent = validateLessonContent(content);
  const validatedOrderIndex = validateLessonOrderIndex(orderIndex);

  await ensureClassAccess(classId, user, "MANAGE");

  return lessonRepository.createLesson({
    classId,
    title: validatedTitle,
    content: validatedContent,
    orderIndex: validatedOrderIndex,
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
  if (updateData.title !== undefined) {
    updateData.title = validateLessonTitle(updateData.title);
  }
  if (updateData.content !== undefined) {
    updateData.content = validateLessonContent(updateData.content);
  }
  if (updateData.orderIndex !== undefined) {
    updateData.orderIndex = validateLessonOrderIndex(updateData.orderIndex);
  }
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

  const progress = await lessonRepository.markCompleted(lessonId, user.id);

  if (!progress) {
    throw new ConflictError("Lesson has already been marked as completed.");
  }

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
