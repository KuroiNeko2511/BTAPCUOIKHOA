import * as classRepository from "../repository/class.repository.js";
import * as userRepository from "../repository/user.repository.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../core/error.response.js";
import { ROLES } from "../core/constants.js";
import { parsePositiveInt, parseDateOnly } from "../utils/validators.js";
import { formatStoredDate } from "../utils/date.helper.js";

//kiểm tra ngày hợp lệ và ngày kết thúc không trước ngày bắt đầu
const assertValidDateRange = (startDate, endDate) => {
  if (startDate != null) {
    parseDateOnly(startDate, "startDate");
  }

  if (endDate != null) {
    parseDateOnly(endDate, "endDate");
  }

  if (startDate != null && endDate != null && endDate < startDate) {
    throw new BadRequestError("endDate must be on or after startDate.");
  }
};
//kiểm tra mentor tồn tại và đang hoạt động
const assertActiveMentor = async (mentorId) => {
  const mentor = await userRepository.findById(mentorId);

  if (!mentor || !mentor.is_active) {
    throw new NotFoundError("Mentor not found or inactive.");
  }

  return mentor;
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
  if (!classData || typeof classData !== "object" || Array.isArray(classData)) {
    throw new BadRequestError("Please check the class details and try again.");
  }

  const { name, description, mentorId, startDate, endDate } = classData;

  if (typeof name !== "string" || !name.trim() || name.trim().length > 150) {
    throw new BadRequestError(
      "Please enter a class name between 1 and 150 characters.",
    );
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    throw new BadRequestError(
      "Please enter a description using text, or leave it blank.",
    );
  }

  const parsedMentorId = parsePositiveInt(mentorId, "mentorId");

  assertValidDateRange(startDate, endDate);
  await assertActiveMentor(parsedMentorId);

  const normalizedName = name.trim();
  const existingClass = await classRepository.findByName(normalizedName);

  if (existingClass) {
    throw new ConflictError("A class with this name already exists.");
  }

  const data = {
    name: normalizedName,
    description: description ?? null,
    mentorId: parsedMentorId,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
  };

  const id = await classRepository.insertClass(data);

  return { id, ...data };
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
  const id = parsePositiveInt(classId, "Class ID");
  const foundClass = await findClassOrThrow(id);

  if (user.role === ROLES.ADMIN) return foundClass;

  const isEnrolledOrMentor = await classRepository.isMemberOrMentorOfClass(
    id,
    user.id,
  );
  if (!isEnrolledOrMentor) {
    throw new ForbiddenError(
      "Access denied. You do not have access to this class.",
    );
  }

  return foundClass;
};

// Cập nhật lớp
export const updateExistingClass = async (classId, updateData) => {
  const id = parsePositiveInt(classId, "Class ID");

  if (
    !updateData ||
    typeof updateData !== "object" ||
    Array.isArray(updateData)
  ) {
    throw new BadRequestError("Request body must be a JSON object.");
  }

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestError("No fields to update.");
  }

  const allowedFields = [
    "name",
    "description",
    "mentorId",
    "startDate",
    "endDate",
    "status",
  ];

  const unsupportedFields = Object.keys(updateData).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unsupportedFields.length > 0) {
    throw new BadRequestError(
      `Unsupported fields: ${unsupportedFields.join(", ")}.`,
    );
  }

  const existingClass = await findClassOrThrow(id);

  const startDate =
    updateData.startDate !== undefined
      ? updateData.startDate
      : formatStoredDate(existingClass.start_date);

  const endDate =
    updateData.endDate !== undefined
      ? updateData.endDate
      : formatStoredDate(existingClass.end_date);

  assertValidDateRange(startDate, endDate);

  if (updateData.name !== undefined) {
    if (typeof updateData.name !== "string") {
      throw new BadRequestError("name must be a string.");
    }

    const normalizedName = updateData.name.trim();

    if (normalizedName.length === 0 || normalizedName.length > 150) {
      throw new BadRequestError(
        "name must contain between 1 and 150 characters.",
      );
    }

    const duplicate = await classRepository.findByName(normalizedName);

    if (duplicate && Number(duplicate.id) !== id) {
      throw new ConflictError("A class with this name already exists.");
    }

    updateData.name = normalizedName;
  }

  const data = { ...updateData };
  data.description = validateClassDescription(data.description);
  data.status = validateClassStatus(data.status);
  if (data.mentorId !== undefined) {
    data.mentorId = parsePositiveInt(data.mentorId, "mentorId");

    await assertActiveMentor(data.mentorId);
  }

  return classRepository.update(id, data);
};

// Xóa lớp
export const deleteClassById = async (classId) => {
  const id = parsePositiveInt(classId, "Class ID");
  await findClassOrThrow(id);
  return classRepository.deleteById(id);
};
