import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
const express = require('express');

const router = express.Router();

// Rota protegida - requer autenticação
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    // O usuário está disponível em req.user devido ao middleware
    const user = req.user!;
    
    res.json({
      id: user.id,
      email: user.email,
      message: 'Profile data retrieved successfully',
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Rota protegida para atualizar perfil
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { name, bio } = req.body;
    
    // Aqui você pode usar Prisma para atualizar o perfil no banco
    // const updatedProfile = await prisma.userProfile.upsert({
    //   where: { user_id: user.id },
    //   update: { name, bio },
    //   create: { user_id: user.id, name, bio }
    // });
    
    res.json({
      message: 'Profile updated successfully',
      user: { id: user.id, email: user.email, name, bio }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
