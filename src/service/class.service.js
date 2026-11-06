import * as classRepository from "../repository/class.repository.js";
import * as userRepository from "../repository/user.repository.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../core/error.response.js";
import { ROLES } from "../core/constants.js";
import { parsePositiveInt } from "../utils/validators.js";

// hàm này kiệm để kiểm tra tính hợp lệ của ngày tháng, nếu không hợp lệ sẽ ném ra lỗi BadRequestError
const parseDate = (value, fieldName) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(`Invalid ${fieldName}.`);
  }

  return date;
};
// Tôi tách findClassOrThrow để tái sử dụng khỏi phỉ code nhiều lần
const findClassOrThrow = async (classId) => {
  const foundClass = await classRepository.findById(classId);

  if (!foundClass) {
    throw new NotFoundError("Class not found.");
  }

  return foundClass;
};

export const createNewClass = async (classData) => {
  const { name, mentor_id, start_date, end_date } = classData;

  if (!name?.trim() || mentor_id === undefined) {
    throw new BadRequestError("Class name and mentor ID are required.");
  }

  const mentorId = parsePositiveInt(mentor_id, "mentor ID");
  assertValidDateRange(start_date, end_date);

  const existingClass = await classRepository.findByName(name);
  if (existingClass) {
    throw new ConflictError("A class with this name already exists.");
  }

  await assertActiveMentor(mentorId);

  const data = { ...classData, mentor_id: mentorId };
  const newClassId = await classRepository.insertClass(data);

  return { ...data, id: newClassId };
};

// getClassesByRole: Lấy danh sách lớp học dựa trên vai trò của người dùng
export const getClassesByRole = async (user) => {
  if (user.role === ROLES.ADMIN) {
    return classRepository.findAllClassesForAdmin();
  }

  return classRepository.findClassesForMember(user.id);
};

// Xem chi tiết lớp và kiểm tra quyền
export const getClassDetail = async (classId, user) => {
  const foundClass = await findClassOrThrow(classId);

  if (user.role === ROLES.ADMIN) return foundClass;

  const isEnrolledOrMentor = await classRepository.isMemberOrMentorOfClass(
    classId,
    user.id
  );
  if (!isEnrolledOrMentor) {
    throw new ForbiddenError("Access denied. You do not have access to this class.");
  }

  return foundClass;
};

// Cập nhật lớp
export const updateExistingClass = async (classId, updateData) => {
  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError("No fields to update.");
  }

  const existingClass = await findClassOrThrow(classId);

  assertValidDateRange(
    updateData.start_date ?? existingClass.start_date,
    updateData.end_date ?? existingClass.end_date
  );

  if (updateData.name !== undefined && updateData.name !== existingClass.name) {
    const duplicate = await classRepository.findByName(updateData.name);
    if (duplicate && Number(duplicate.id) !== Number(classId)) {
      throw new ConflictError("A class with this name already exists.");
    }
  }

  const data = { ...updateData };
  if (data.mentor_id !== undefined) {
    data.mentor_id = parsePositiveInt(data.mentor_id, "mentor ID");
    await assertActiveMentor(data.mentor_id);
  }

  return classRepository.update(classId, data);
};

// Xóa lớp
export const deleteClassById = async (classId) => {
  await findClassOrThrow(classId);
  return classRepository.deleteById(classId);
};
