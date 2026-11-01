import * as service from "../service/assignment.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const listAssignments = catchAsync(async (req, res) => {
  const data = await service.listAssignments(req.params.classId, req.user);
  return sendSuccess(res, 200, "Lấy danh sách assignment thành công", data);
});

export const readAssignment = catchAsync(async (req, res) => {
  const data = await service.readAssignment(req.params.id, req.user);
  return sendSuccess(res, 200, "Lấy assignment thành công", data);
});

export const createAssignment = catchAsync(async (req, res) => {
  const data = await service.createAssignment(
    req.params.classId,
    req.body,
    req.user,
  );
  return sendSuccess(res, 201, "Tạo assignment thành công", data);
});

export const updateAssignment = catchAsync(async (req, res) => {
  const data = await service.updateAssignment(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, 200, "Cập nhật assignment thành công", data);
});

export const deleteAssignment = catchAsync(async (req, res) => {
  const data = await service.deleteAssignment(req.params.id, req.user);
  return sendSuccess(res, 200, "Xóa assignment thành công", data);
});

export const submitAssignment = catchAsync(async (req, res) => {
  const data = await service.submitAssignment(
    req.params.assignmentId,
    req.body,
    req.user,
  );
  return sendSuccess(res, 201, "Nộp bài thành công", data);
});

export const listSubmissions = catchAsync(async (req, res) => {
  const data = await service.listSubmissions(
    req.params.assignmentId,
    req.user,
  );
  return sendSuccess(res, 200, "Lấy danh sách bài nộp thành công", data);
});

export const readSubmission = catchAsync(async (req, res) => {
  const data = await service.readSubmission(req.params.id, req.user);
  return sendSuccess(res, 200, "Lấy bài nộp thành công", data);
});

export const reviewSubmission = catchAsync(async (req, res) => {
  const data = await service.reviewSubmission(
    req.params.id,
    req.body,
    req.user,
  );
  return sendSuccess(res, 200, "Chấm bài thành công", data);
});