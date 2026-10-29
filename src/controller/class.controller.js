import * as classService from '../service/class.service.js';
import catchAsync from '../utils/catchAsync.js'; 

export const createClass = catchAsync(async (req, res) => {
  const result = await classService.createNewClass(req.body);
  
  res.status(201).json({
    success: true,
    message: 'Tạo lớp học thành công!',
    data: result
  });
});

export const getClasses = catchAsync(async (req, res) => {
  // Truyền thông tin user (id, role) từ token vào service
  const result = await classService.getClassesByRole(req.user);
  
  res.status(200).json({
    success: true,
    message: 'Lấy danh sách lớp học thành công!',
    data: result
  });
});

