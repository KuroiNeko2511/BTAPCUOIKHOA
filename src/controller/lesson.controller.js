import * as lessonService from "../service/lesson.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const createLesson = catchAsync(async (req, res) => {
  const result = await lessonService.createLesson(
    {
      ...req.body,
      classId: req.params.classId,
    },
    req.user,
  );

  return sendSuccess(res, 201, "Lesson created successfully.", result);
});

export const getLessonsByClass = catchAsync(async (req, res) => {
  const result = await lessonService.getLessonsByClass(
    req.params.classId,
    req.user,
  );

  return sendSuccess(res, 200, "Lessons retrieved successfully.", result);
});

export const getLessonById = catchAsync(async (req, res) => {
  const result = await lessonService.getLessonById(
    req.params.lessonId,
    req.user,
  );

  return sendSuccess(res, 200, "Lesson retrieved successfully.", result);
});

export const updateLesson = catchAsync(async (req, res) => {
  const result = await lessonService.updateLesson(
    req.params.lessonId,
    req.body,
    req.user,
  );

  return sendSuccess(res, 200, "Lesson updated successfully.", result);
});

export const deleteLesson = catchAsync(async (req, res) => {
  await lessonService.deleteLesson(req.params.lessonId, req.user);

  return sendSuccess(res, 200, "Lesson deleted successfully.");
});

export const completeLesson = catchAsync(async (req, res) => {
  const result = await lessonService.completeLesson(
    req.params.lessonId,
    req.user,
  );

  return sendSuccess(res, 200, result.message);
});
//getClassProgress: dùng để đánh giá tiến độ học tập của học sinh trong 1 lớp
export const getClassProgress = catchAsync(async (req, res) => {
  const result = await lessonService.getClassProgress(
    req.params.classId,
    req.user,
  );

  return sendSuccess(
    res,
    200,
    "Class progress retrieved successfully.",
    result,
  );
});
