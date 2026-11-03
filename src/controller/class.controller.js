import * as classService from '../service/class.service.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHelper.js';

// 1. Tạo lớp học mới (Admin)
export const createClass = catchAsync(async (req, res) => {
  const result = await classService.createNewClass(req.body);
  return sendSuccess(res, 201, 'Tạo lớp học thành công!', result);
});

// 2. Lấy danh sách lớp học (Admin thấy tất cả, Member thấy lớp mình tham gia)
export const getClasses = catchAsync(async (req, res) => {
  const result = await classService.getClassesByRole(req.user);
  return sendSuccess(res, 200, 'Lấy danh sách lớp học thành công!', result);
});

// 3. Xem chi tiết một lớp học
export const getClassById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await classService.getClassDetail(id, req.user);
  return sendSuccess(res, 200, 'Lấy thông tin chi tiết lớp học thành công!', result);
});

// 4. Cập nhật lớp học (Admin)
export const updateClass = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await classService.updateExistingClass(id, req.body);
  return sendSuccess(res, 200, 'Cập nhật lớp học thành công!', result);
});

// 5. Xóa lớp học (Admin)
export const deleteClass = catchAsync(async (req, res) => {
  const { id } = req.params;
  await classService.deleteClassById(id);
  return sendSuccess(res, 200, 'Xóa lớp học thành công!');
});