import * as classRepository from "../repository/class.repository.js";
import * as classMemberRepository from "../repository/classMember.repository.js";
import * as userRepository from "../repository/user.repository.js";
import { NotFoundError } from "../core/error.response.js";

import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../core/error.response.js";

const parseId = (value) => {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new BadRequestError("ID phải là số nguyên dương");
  }

  return id;
const checkClassExists = async (classId) => {
  const existingClass = await classRepository.findById(classId);
  return existingClass;
};

const getClass = async (id) => {
  const { rows } = await pool.query(
    "SELECT id, mentor_id FROM classes WHERE id = $1",
    [id],
  );

  if (!rows[0]) {
    throw new NotFoundError("Class not found");
  }

  const user = await userRepository.findById(memberId);
  if (!user || !user.is_active) {
    throw new NotFoundError("User not found or is inactive");
  }

  if (user.role !== "MEMBER") {
    throw new BadRequestError("Chỉ được thêm user có role MEMBER");
  }

  const alreadyMember = await classMemberRepository.findMemberInClass(
    classId,
    memberId,
  );
  if (alreadyMember) {
    const error = new Error("Member is already enrolled in this class");
    error.statusCode = 409; // Conflict
    throw error;
  }

  await classMemberRepository.addMember(classId, memberId);
  return { classId, memberId, message: "Member added successfully" };
};

export const getMembersByClassId = async (classId, currentUser) => {
  // 1. Kiểm tra lớp học có tồn tại hay không
  const foundClass = await classRepository.findById(classId);
  if (!foundClass) {
    throw new NotFoundError("Lớp học không tồn tại!");
  }

  // 2. Kiểm tra quyền truy cập nếu không phải ADMIN
  if (currentUser.role !== "ADMIN") {
    const isMentor = foundClass.mentor_id === currentUser.id;
    const isMember = await classMemberRepository.isUserInClass(
      classId,
      currentUser.id,
    );

    if (!isMentor && !isMember) {
      throw new ForbiddenError(
        "Bạn không có quyền xem danh sách thành viên của lớp học này!",
      );
    }
  }

  // 3. Hợp lệ -> Trả về danh sách thành viên
  return await classMemberRepository.getMembersByClassId(classId);
};

export const removeMemberFromClass = async (classId, memberId) => {
  classId = parseId(classId);
  memberId = parseId(memberId);

  const existingEnrollment = await classMemberRepository.findMemberInClass(
    classId,
    memberId,
  );
  if (!existingEnrollment) {
    const error = new Error("Member not found in this class");
    error.statusCode = 404;
    throw error;
  }

  await classMemberRepository.removeMember(classId, memberId);
  return { message: "Member removed from class successfully" };
};
