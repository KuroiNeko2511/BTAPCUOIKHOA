// src/service/auth.service.js
import * as userRepository from "../repository/user.repository.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../core/error.response.js";
import { hashPassword, comparePassword } from "../utils/password.helper.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.helper.js";

export const register = async ({ name, email, password, role }) => {
  // 1. Kiểm tra xem email đã tồn tại hay chưa
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ConflictError("Email này đã được sử dụng!");
  }

  // 2. Băm mật khẩu trước khi lưu DB
  const hashedPassword = await hashPassword(password);

  // 3. Lưu vào Database (khớp chuẩn key passwordHash với repository)
  const newUser = await userRepository.create({
    name,
    email,
    passwordHash: hashedPassword,
    role: role || "MEMBER",
  });

  // 4. Loại bỏ password_hash trước khi phản hồi về client
  const { password_hash, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const login = async ({ email, password }) => {
  // 1. Tìm tài khoản theo email
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Email hoặc mật khẩu không chính xác!");
  }

  // 2. So sánh mật khẩu đầu vào với chuỗi băm trong DB (dùng user.password_hash)
  const isMatch = await comparePassword(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError("Email hoặc mật khẩu không chính xác!");
  }

  // 3. Tạo Payload chứa các thông tin định danh cần thiết
  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // 4. Ký phát hành cả Access Token và Refresh Token
  const accessToken = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // 5. Trả về thông tin cơ bản kèm token
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

export const getMe = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError("Người dùng không còn tồn tại trên hệ thống!");
  }

  // Loại bỏ password_hash trước khi trả về client
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};