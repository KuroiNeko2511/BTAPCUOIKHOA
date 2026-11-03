import ApiError from "../core/error.response.js";
import { ConflictError } from "../core/error.response.js";

// Error handling middleware (luôn đủ 4 tham số: err, req, res, next)
const errorHandler = (err, req, res, next) => {
  // 1. Log chi tiết lỗi và vị trí phát sinh (file, dòng code)
  console.error(`[ERROR] ${err.name || "Error"}: ${err.message}`);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  // 2. Chuyển đổi lỗi Database PostgreSQL (Unique constraint vi phạm: mã 23505)
  if (err.code === "23505") {
    if (err.table === "users" || err.constraint?.includes("users_email")) {
      err = new ConflictError("Email hoặc thông tin người dùng đã tồn tại!");
    } else if (err.table === "classes") {
      err = new ConflictError("Thông tin lớp học bị trùng lặp!");
    } else if (err.table === "class_members" || err.constraint?.includes("class_member")) {
      err = new ConflictError("Thành viên đã tham gia lớp học này!");
    } else if (err.table === "lessons" || err.constraint?.includes("lesson_class_order")) {
      err = new ConflictError("Thứ tự bài học trong lớp đã tồn tại!");
    } else {
      err = new ConflictError("Dữ liệu đã tồn tại trong hệ thống!");
    }
  }

  // 3. Nếu là lỗi nghiệp vụ do hệ thống chủ động ném (ApiError và các class con)
  if (err instanceof ApiError) {
    const response = {
      success: false,
      message: err.message,
    };
    if (err.errors) response.errors = err.errors; // Đính kèm lỗi từ validation middleware nếu có
    return res.status(err.statusCode).json(response);
  }

  // 4. Bắt các lỗi có sẵn status từ middleware khác (vd: body-parser, multer)
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? "Internal Server Error" : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;