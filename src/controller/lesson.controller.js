import * as lessonService from "../service/lesson.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const createLesson = catchAsync(async (req, res) => {
  const classId = req.params.id || req.params.classId || req.body.classId;
  const result = await lessonService.createLesson({
    classId: Number(classId),
    ...req.body,
    userId: req.user.id,
  });
  // ✅ Truyền đúng: res, statusCode, message, data
  return sendSuccess(res, 201, "Tạo bài học thành công", result);
});

export const getLessonsByClass = catchAsync(async (req, res) => {
  const classId = req.params.id || req.params.classId;
  const result = await lessonService.getLessonsByClass(classId, req.user);
  return sendSuccess(res, 200, "Lấy danh sách bài học thành công", result);
});

export const getLessonById = catchAsync(async (req, res) => {
  const result = await lessonService.getLessonById(req.params.id, req.user);
  return sendSuccess(res, 200, "Lấy chi tiết bài học thành công", result);
});

export const updateLesson = catchAsync(async (req, res) => {
  const result = await lessonService.updateLesson(req.params.id, req.body);
  return sendSuccess(res, 200, "Cập nhật bài học thành công", result);
});

export const deleteLesson = catchAsync(async (req, res) => {
  await lessonService.deleteLesson(req.params.id);
  return sendSuccess(res, 200, "Xóa bài học thành công");
});

export const completeLesson = catchAsync(async (req, res) => {
  const result = await lessonService.completeLesson(req.params.id, req.user.id, req.user.role);
  return sendSuccess(res, 200, result.message || "Hoàn thành bài học thành công!");
});

export const getClassProgress = catchAsync(async (req, res) => {
  const classId = req.params.id || req.params.classId;
  const result = await lessonService.getClassProgress(classId, req.user);
  return sendSuccess(res, 200, "Lấy tiến độ học tập thành công", result);
});