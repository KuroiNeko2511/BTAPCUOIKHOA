import * as classRepository from "../repository/class.repository.js";
import * as classMemberRepository from "../repository/classMember.repository.js";
import * as userRepository from "../repository/user.repository.js";
import { NotFoundError } from "../core/error.response.js";

const checkClassExists = async (classId) => {
  const existingClass = await classRepository.findById(classId);
  return existingClass;
};

export const addMemberToClass = async (classId, memberId) => {
  // 1. Kiểm tra lớp học tồn tại
  const existingClass = await checkClassExists(classId);
  if (!existingClass) {
    const error = new Error("Class not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await userRepository.findById(memberId);
  if (!user || !user.is_active) {
    const error = new Error("User not found or is inactive");
    error.statusCode = 404;
    throw error;
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
  const existingClass = await checkClassExists(classId);
  if (!existingClass) {
    const error = new Error("Class not found");
    error.statusCode = 404;
    throw error;
  }

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
