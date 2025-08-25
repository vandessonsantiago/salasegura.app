import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
  // GET /api/user/profile - Obter perfil do usuário autenticado
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const user = await UserService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Remover informações sensíveis
      const { ...userProfile } = user;
      
      res.json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // PUT /api/user/profile - Atualizar perfil do usuário
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { name, avatar_url, phone } = req.body;
      
      const updatedUser = await UserService.updateUser(userId, {
        name,
        avatar_url,
        phone,
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // PUT /api/user/profile/extended - Atualizar perfil estendido
  static async updateExtendedProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { bio, company, website, location, theme, language, timezone } = req.body;
      
      const updatedProfile = await UserService.updateUserProfile(userId, {
        bio,
        company,
        website,
        location,
        theme,
        language,
        timezone,
      });

      res.json({
        success: true,
        data: updatedProfile,
        message: 'Extended profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating extended profile:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // POST /api/user/session - Registrar nova sessão
  static async createSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const ip_address = req.ip || req.connection.remoteAddress;
      const user_agent = req.get('User-Agent');

      const session = await UserService.createUserSession(userId, ip_address, user_agent);

      res.json({
        success: true,
        data: session,
        message: 'Session created successfully'
      });
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // POST /api/user/activity - Registrar atividade
  static async logActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { action, details } = req.body;
      
      if (!action) {
        res.status(400).json({ error: 'Action is required' });
        return;
      }

      const ip_address = req.ip || req.connection.remoteAddress;
      const user_agent = req.get('User-Agent');

      const activity = await UserService.logActivity(userId, action, details, ip_address, user_agent);

      res.json({
        success: true,
        data: activity,
        message: 'Activity logged successfully'
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  // Webhook para sincronizar usuário com Supabase Auth
  static async syncUser(req: Request, res: Response): Promise<void> {
    try {
      const { record, type } = req.body;
      
      if (type === 'INSERT' || type === 'UPDATE') {
        const userData = {
          id: record.id,
          email: record.email,
          name: record.raw_user_meta_data?.name,
          avatar_url: record.raw_user_meta_data?.avatar_url,
          phone: record.phone,
        };

        const user = await UserService.upsertUser(userData);
        
        // Log da atividade
        await UserService.logActivity(
          user.id, 
          type === 'INSERT' ? 'user_registered' : 'user_updated',
          { source: 'supabase_webhook' }
        );

        res.json({
          success: true,
          data: user,
          message: `User ${type.toLowerCase()}d successfully`
        });
      } else {
        res.status(400).json({ error: 'Invalid webhook type' });
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}

export default UserController;
