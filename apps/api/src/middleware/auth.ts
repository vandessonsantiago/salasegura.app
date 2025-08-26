import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { UserService } from '../services/UserService';

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    // Validar o token com Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Garantir que o usuário exista na base local (para FKs)
    try {
      await UserService.upsertUser({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
        phone: user.phone || undefined,
      });
    } catch (e) {
      console.error('[Auth] Falha ao upsert user local', e);
      // Prosseguir mesmo assim; se falhar, rotas com FK vão quebrar e facilitar debug
    }

    // Adicionar user ao request (payload simplificado)
    req.user = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || null,
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at || user.created_at),
      avatar_url: user.user_metadata?.avatar_url || null,
      phone: user.phone || null,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};
