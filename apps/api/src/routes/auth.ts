import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
const express = require('express');

const router = express.Router();

// Endpoint para login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
        created_at: data.user?.created_at,
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Endpoint para validar token (opcional - para debugging)
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Endpoint para logout (limpar sessão)
router.post('/signout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await supabaseAdmin.auth.signOut();
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Signout failed' });
  }
});

export default router;
