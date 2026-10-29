import * as classRepo from '../repository/class.repository.js';
import { BadRequestError } from '../core/error.response.js';
import pool from '../config/db.config.js';

export const createNewClass = async (classData) => {
  const { name, mentorId } = classData;
  
  if (!name || !mentorId) {
    throw new BadRequestError('Tên lớp và Mentor ID là bắt buộc!');
  }

  // Kiểm tra mentorId 
  const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [mentorId]);
  if (users.length === 0) {
    throw new BadRequestError('Mentor ID không tồn tại trong hệ thống!');
  }

  const newClassId = await classRepo.insertClass(classData);
  return { id: newClassId, ...classData };
};

export const getClassesByRole = async (user) => {
  if (user.role === 'ADMIN') {
    return await classRepo.findAllClassesForAdmin();
  } else {
    return await classRepo.findClassesForMember(user.id);
  }
};