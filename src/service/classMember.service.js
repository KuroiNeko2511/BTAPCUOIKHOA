import * as classMemberRepository from "../repository/classMember.repository.js";
import * as classRepository from "../repository/class.repository.js";
import * as userRepository from "../repository/user.repository.js";
import { ROLES } from "../core/constants.js";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../core/error.response.js";

export const addMemberToClass = async (classId, memberId) => {
  const clsId = Number(classId);
  const memId = Number(memberId);

  // 1. Kiểm tra lớp học tồn tại
  const existingClass = await classRepository.findById(clsId);
  if (!existingClass) {
    throw new NotFoundError("Class not found.");
  }

  // 2. Chặn thêm chính Mentor của lớp vào làm học viên
  if (Number(existingClass.mentor_id) === memId) {
    throw new BadRequestError(
      "Cannot add the class mentor as a student member.",
    );
  }

  // 3. Kiểm tra user tồn tại, đang hoạt động và có role MEMBER
  const user = await userRepository.findById(memId);
  if (!user || !user.is_active) {
    throw new NotFoundError("User not found or is inactive.");
  }

  if (user.role !== ROLES.MEMBER) {
    throw new BadRequestError(
      "Only users with MEMBER role can be enrolled in a class.",
    );
  }

  // 4. Chống thêm trùng thành viên vào cùng một lớp
  const alreadyMember = await classMemberRepository.findMemberInClass(
    clsId,
    memId,
  );
  if (alreadyMember) {
    throw new ConflictError("Member is already enrolled in this class.");
  }
  await classMemberRepository.addMember(clsId, memId);
  return { classId: clsId, memberId: memId };
};

export const getMembersByClass = async (classId, user) => {
  const clsId = Number(classId);
  const existingClass = await classRepository.findById(clsId);
  if (!existingClass) {
    throw new NotFoundError("Class not found.");
  }

  if (user.role !== ROLES.ADMIN) {
    const hasAccess = await classRepository.isMemberOrMentorOfClass(
      clsId,
      user.id,
    );
    if (!hasAccess) {
      throw new ForbiddenError(
        "Access denied. You do not belong to this class.",
      );
    }
  }

  return classMemberRepository.getMembersByClassId(clsId);
};

export const removeMemberFromClass = async (classId, memberId) => {
  const clsId = Number(classId);
  const memId = Number(memberId);

  const existingClass = await classRepository.findById(clsId);
  if (!existingClass) {
    throw new NotFoundError("Class not found.");
  }

  const alreadyMember = await classMemberRepository.findMemberInClass(
    clsId,
    memId,
  );
  if (!alreadyMember) {
    throw new NotFoundError("Member is not enrolled in this class.");
  }

  await classMemberRepository.removeMember(clsId, memId);
  return { classId: clsId, memberId: memId };
};
