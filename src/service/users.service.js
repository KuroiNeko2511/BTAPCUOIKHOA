import * as userRepository from "../repository/user.repository.js";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../core/error.response.js";
import { hashPassword } from "../utils/password.helper.js";

// Helper kiểm tra và chuẩn hóa ID số nguyên dương
const parseUserId = (userId) => {
  const parsedId = Number(userId);

  if (
    !userId ||
    isNaN(parsedId) ||
    !Number.isInteger(parsedId) ||
    parsedId <= 0
  ) {
    throw new BadRequestError("User ID must be a valid positive integer");
  }

  return parsedId;
};

// 1. Lấy danh sách users
export const getAllUsers = async (query) => {
  return await userRepository.findAll(query || {});
};

// 2. Lấy thông tin user theo ID
export const getUserById = async (userId) => {
  const id = parseUserId(userId);
  const user = await userRepository.findById(id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const { password_hash, ...safeUser } = user;
  return safeUser;
};

// 3. Tạo user mới (Tự động kiểm tra trùng email và băm mật khẩu)
export const createUser = async ({ name, email, password, role }) => {
  if (!email || !password) {
    throw new BadRequestError("Email and password are required");
  }

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ConflictError("Email already exists");
  }

  // Băm mật khẩu bằng helper
  const passwordHash = await hashPassword(password);

  const newUser = await userRepository.create({
    name,
    email,
    passwordHash,
    role: role || "MEMBER",
  });

  const { password_hash, ...safeUser } = newUser;
  return safeUser;
};

// 4. Cập nhật thông tin user
export const updateUser = async (userId, updateData) => {
  const id = parseUserId(userId);

  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found");
  }

  // Kiểm tra trùng email nếu có yêu cầu đổi email
  if (updateData.email && updateData.email !== existingUser.email) {
    const emailTaken = await userRepository.findByEmail(updateData.email);
    if (emailTaken && emailTaken.id !== id) {
      throw new ConflictError("Email already exists");
    }
  }

  // Băm lại mật khẩu nếu request có truyền password mới
  const dataToUpdate = { ...updateData };
  if (dataToUpdate.password) {
    dataToUpdate.passwordHash = await hashPassword(dataToUpdate.password);
    delete dataToUpdate.password;
  }

  const updatedUser = await userRepository.update(id, dataToUpdate);
  const { password_hash, ...safeUser } = updatedUser;
  return safeUser;
};

// 5. Xóa mềm user
export const deleteUser = async (userId) => {
  const id = parseUserId(userId);

  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found");
  }

  const deletedUser = await userRepository.deleteById(id);
  const { password_hash, ...safeUser } = deletedUser;
  return safeUser;
};
