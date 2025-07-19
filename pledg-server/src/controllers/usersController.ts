import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: (error as Error).message });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: (error as Error).message });
  }
};

export const createOrUpdateUser = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    res.status(500).json({ message: 'Failed to create/update user', error: (error as Error).message });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(500).json({ message: 'Failed to update user', error: (error as Error).message });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ message: 'User ID is required' });
    return;
  }
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.status(204).send();
  } catch (error) {
    if ((error as any).code === 'P2025') {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(500).json({ message: 'Failed to delete user', error: (error as Error).message });
  }
}; 