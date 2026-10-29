// src/middleware/auth.middleware.js
import { UnauthorizedError } from "../core/error.response.js";
import { verifyToken } from "../utils/jwt.helper.js";

export const authenticateToken = (req, res, next) => {
  // 1. Lấy giá trị từ Authorization Header
  const authHeader = req.headers["authorization"];

  // Header chuẩn có dạng: "Bearer eyJhbGciOi..."
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Bạn chưa đăng nhập! Vui lòng cung cấp token hợp lệ.");
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Xác thực và giải mã token
    const decoded = verifyToken(token);

    // 3. Gán payload đã decode vào request để các controller phía sau dùng
    req.user = decoded;

    // 4. Cho phép đi tiếp vào Controller
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token của bạn đã hết hạn, vui lòng đăng nhập lại!");
    }
    throw new UnauthorizedError("Token không hợp lệ hoặc đã bị chỉnh sửa trái phép!");
  }
};