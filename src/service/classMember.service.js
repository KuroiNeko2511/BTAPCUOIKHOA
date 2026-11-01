import * as classMemberRepo from "../repository/classMember.repository.js";
import * as userRepo from "../repository/user.repository.js";
import pool from "../config/db.config.js";

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
};

const getClass = async (id) => {
  const { rows } = await pool.query(
    "SELECT id, mentor_id FROM classes WHERE id = $1",
    [id],
  );

  if (!rows[0]) {
    throw new NotFoundError("Class not found");
  }

  return rows[0];
};

export const addMemberToClass = async (classId, memberId) => {
  classId = parseId(classId);
  memberId = parseId(memberId);

  await getClass(classId);

  const user = await userRepo.findById(memberId);

  if (!user || !user.is_active) {
    throw new NotFoundError("User not found or is inactive");
  }

  if (user.role !== "MEMBER") {
    throw new BadRequestError("Chỉ được thêm user có role MEMBER");
  }

  const existing = await classMemberRepo.findMemberInClass(classId, memberId);

  if (existing) {
    throw new ConflictError("Member is already enrolled in this class");
  }

  try {
    await classMemberRepo.addMember(classId, memberId);
  } catch (error) {
    if (error.code === "23505" && error.constraint === "uq_class_member") {
      throw new ConflictError("Member is already enrolled in this class");
    }

    throw error;
  }

  return { classId, memberId };
};

export const getMembersOfClass = async (classId, user) => {
  classId = parseId(classId);

  const classInfo = await getClass(classId);

  const isAdmin = user.role === "ADMIN";
  const isMentor = Number(classInfo.mentor_id) === Number(user.id);

  if (!isAdmin && !isMentor) {
    const membership = await classMemberRepo.findMemberInClass(
      classId,
      user.id,
    );

    if (!membership) {
      throw new ForbiddenError("Bạn không có quyền xem thành viên lớp này");
    }
  }

  return classMemberRepo.getMembersByClassId(classId);
};

export const removeMemberFromClass = async (classId, memberId) => {
  classId = parseId(classId);
  memberId = parseId(memberId);

  await getClass(classId);

  const removed = await classMemberRepo.removeMember(classId, memberId);

  if (!removed) {
    throw new NotFoundError("Member not found in this class");
  }

  return { classId, memberId };
};
