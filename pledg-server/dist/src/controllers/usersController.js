"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createOrUpdateUser = exports.getUserById = exports.getAllUsers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllUsers = async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                createdAt: true,
            }
        });
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
    }
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
};
exports.getUserById = getUserById;
const createOrUpdateUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
    }
    try {
        const data = req.body;
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: data,
            create: { id: userId, ...data }
        });
        res.status(200).json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to create/update user', error: error.message });
    }
};
exports.createOrUpdateUser = createOrUpdateUser;
const updateUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
    }
    try {
        const data = req.body;
        const user = await prisma.user.update({
            where: { id: userId },
            data,
        });
        res.status(200).json(user);
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
    }
    try {
        await prisma.user.delete({ where: { id: userId } });
        res.status(204).send();
    }
    catch (error) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=usersController.js.map