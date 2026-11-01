import * as classRepository from "../repository/class.repository.js";
import * as userRepository from "../repository/user.repository.js";
import { NotFoundError, ForbiddenError } from "../core/error.response.js";

export const createNewClass = async (classData) => {
  const { name, mentorId } = classData;

  if (!name || !mentorId) {
    throw new BadRequestError("Tên lớp và Mentor ID là bắt buộc!");
  }

  // 1. Kiểm tra trùng tên lớp học
  const existingClass = await classRepository.findByName(name);
  if (existingClass) {
    throw new ConflictError("Tên lớp học đã tồn tại trong hệ thống!");
  }

  // 2. Kiểm tra Mentor có tồn tại không
  const mentor = await userRepository.findById(mentorId);
  if (!mentor) {
    throw new BadRequestError("Mentor ID không tồn tại trong hệ thống!");
  }

  // 3. Tiến hành tạo lớp mới
  const newClassId = await classRepository.insertClass(classData);
  return { id: newClassId, ...classData };
};

export const getClassesByRole = async (user) => {
  if (user.role === "ADMIN") {
    return await classRepository.findAllClassesForAdmin();
  } else {
    return await classRepository.findClassesForMember(user.id);
  }
};

// Xem chi tiết lớp và kiểm tra quyền
export const getClassDetail = async (classId, user) => {
  const foundClass = await classRepository.findById(classId);
  if (!foundClass) {
    throw new NotFoundError("Lớp học không tồn tại!");
  }

  // Nếu là Admin thì có quyền xem
  if (user.role === "ADMIN") return foundClass;

  // Nếu là Member, phải là Mentor của lớp hoặc đã tham gia vào lớp
  const isEnrolledOrMentor = await classRepository.isMemberOrMentorOfClass(
    classId,
    user.id,
  );
  if (!isEnrolledOrMentor) {
    throw new ForbiddenError("Bạn không có quyền truy cập lớp học này!");
  }

  return foundClass;
};

// Cập nhật lớp
export const updateExistingClass = async (classId, updateData) => {
  const existingClass = await classRepository.findById(classId);
  if (!existingClass) {
    throw new NotFoundError("Lớp học không tồn tại!");
  }
  return await classRepository.update(classId, updateData);
};

// Xóa lớp
export const deleteClassById = async (classId) => {
  const existingClass = await classRepository.findById(classId);
  if (!existingClass) {
    throw new NotFoundError("Lớp học không tồn tại!");
  }
  return await classRepository.deleteById(classId);
};
