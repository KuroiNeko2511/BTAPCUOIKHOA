import * as usersService from '../service/users.service.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/responseHelper.js';
import { NotFoundError } from '../core/error.response.js';

export const getAllUsers = catchAsync(async (req, res) => {
    const users = await usersService.getAllUsers(req.query);
    return sendSuccess(res, 200, 'Users retrieved successfully', users);
});

export const getUserById = catchAsync(async (req, res) => {
    const user = await usersService.getUserById(req.params.id);
    return sendSuccess(res, 200, 'User retrieved successfully', user);
});

export const createUser = catchAsync(async (req, res) => {
    const newUser = await usersService.createUser(req.body);
    return sendSuccess(res, 201, 'User created successfully', newUser);
});

export const updateUser = catchAsync(async (req, res) => {
    const updatedUser = await usersService.updateUser(req.params.id, req.body);
    return sendSuccess(res, 200, 'User updated successfully', updatedUser);
});

export const deleteUser = catchAsync(async (req, res) => {
    const deletedUser = await usersService.deleteUser(req.params.id);
    return sendSuccess(res, 200, 'User deleted successfully', deletedUser);
});