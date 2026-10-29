import * as classMemberRepo from "../repository/classMember.repository.js";
import * as userRepo from "../repository/user.repository.js";
import pool from "../config/db.config.js";

const checkClassExists = async (classId) => {
  const [rows] = await pool.execute("SELECT id FROM classes WHERE id = ?", [classId]);
  return rows[0] || null;
};

export const addMemberToClass = async (classId, memberId) => {
  // 1. Kiểm tra lớp học tồn tại
  const existingClass = await checkClassExists(classId);
  if (!existingClass) {
    const error = new Error("Class not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await userRepo.findById(memberId);
  if (!user || !user.is_active) {
    const error = new Error("User not found or is inactive");
    error.statusCode = 404;
    throw error;
  }

  const alreadyMember = await classMemberRepo.findMemberInClass(classId, memberId);
  if (alreadyMember) {
    const error = new Error("Member is already enrolled in this class");
    error.statusCode = 409; // Conflict
    throw error;
  }

  await classMemberRepo.addMember(classId, memberId);
  return { classId, memberId, message: "Member added successfully" };
};

export const getMembersOfClass = async (classId) => {
  const existingClass = await checkClassExists(classId);
  if (!existingClass) {
    const error = new Error("Class not found");
    error.statusCode = 404;
    throw error;
  }

  return await classMemberRepo.getMembersByClassId(classId);
};

export const removeMemberFromClass = async (classId, memberId) => {
  const existingClass = await checkClassExists(classId);
  if (!existingClass) {
    const error = new Error("Class not found");
    error.statusCode = 404;
    throw error;
  }

  const existingEnrollment = await classMemberRepo.findMemberInClass(classId, memberId);
  if (!existingEnrollment) {
    const error = new Error("Member not found in this class");
    error.statusCode = 404;
    throw error;
  }

  await classMemberRepo.removeMember(classId, memberId);
  return { message: "Member removed from class successfully" };
};