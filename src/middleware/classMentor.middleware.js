import * as lessonRepository from "../repository/lesson.repository.js";
import * as classRepository from "../repository/class.repository.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../core/error.response.js";
import catchAsync from "../utils/catchAsync.js";

const ADMIN_ROLE = "ADMIN";
const parsePositiveInt = (value, fieldName) => {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new BadRequestError(`Invalid ${fieldName}.`);
  }

  return number;
};

const authorizeClassAccess = async (req, classId) => {
  const currentClass = await classRepository.findById(classId);

  if (!currentClass) {
    throw new NotFoundError("Class not found.");
  }

  req.classId = classId;

  if (req.user.role === ADMIN_ROLE) return;

  if (Number(currentClass.mentor_id) !== Number(req.user.id)) {
    throw new ForbiddenError(
      "Access denied. You are not the assigned mentor of this class."
    );
  }
};

export const requireClassMentor = catchAsync(async (req, _res, next) => {
  const classId = parsePositiveInt(
    req.params.classId ?? req.params.id ?? req.body?.classId,
    "class ID"
  );

  await authorizeClassAccess(req, classId);
  next();
});

export const requireLessonMentor = catchAsync(async (req, _res, next) => {
  const lessonId = parsePositiveInt(
    req.params.lessonId ?? req.params.id,
    "lesson ID"
  );

  const lesson = await lessonRepository.findLessonById(lessonId);

  if (!lesson) {
    throw new NotFoundError("Lesson not found.");
  }

  await authorizeClassAccess(req, Number(lesson.class_id));
  next();
});