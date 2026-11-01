import * as userRepository from "../repository/user.repository.js";

import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from "../core/error.response.js";

import { hashPassword } from "../utils/password.helper.js";
const parseUserId = (userId) => {
  const parsedId = Number(userId);

  if (
    !userId ||
    isNaN(parsedId) ||
    !Number.isInteger(parsedId) ||
    parsedId <= 0
  ) {
    throw new BadRequestError("User ID must be a valid positive integer"); // Trả về 400
  }

  return parsedId;
};

export const getAllUsers = async (query) => {
  return await userRepository.findAll(query);
};

export const getUserById = async (userId) => {
  const id = parseUserId(userId);
  const user = await userRepository.findById(id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};

export const createUser = async (userData) => {
  const role = userData.role ?? "MEMBER";

  if (!["ADMIN", "MEMBER"].includes(role)) {
    throw new BadRequestError("Role phải là ADMIN hoặc MEMBER");
  }

  if (
    typeof userData.password !== "string" ||
    userData.password.trim().length < 6
  ) {
    throw new BadRequestError("Mật khẩu phải có tối thiểu 6 ký tự");
  }

  const existingUser = await userRepository.findByEmail(userData.email);

  if (existingUser) {
    throw new ConflictError("Email already exists");
  }

  const passwordHash = await hashPassword(userData.password);

  return userRepository.create({
    name: userData.name,
    email: userData.email,
    passwordHash,
    role,
  });
};

export const updateUser = async (userId, updateData) => {
  const id = parseUserId(userId);

  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found");
  }

  if (updateData.email && updateData.email !== existingUser.email) {
    const emailTaken = await userRepository.findByEmail(updateData.email);
    if (emailTaken && emailTaken.id !== id) {
      throw new ConflictError("Email already exists");
    }
  }

  return await userRepository.update(id, updateData);
};

export const deleteUser = async (userId) => {
  const id = parseUserId(userId);

  const existingUser = await userRepository.findById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found");
  }

  return await userRepository.deleteById(id);
};
