import { supabaseAdmin } from '../lib/supabase';

export interface CreateUserData {
  id: string; // UUID do Supabase Auth
  email: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
}

export interface UpdateUserData {
  name?: string;
  avatar_url?: string;
  phone?: string;
}

export interface CreateUserProfileData {
  user_id: string;
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
  theme?: string;
  language?: string;
  timezone?: string;
}

export interface UpdateUserProfileData {
  bio?: string;
  company?: string;
  website?: string;
  location?: string;
  theme?: string;
  language?: string;
  timezone?: string;
}

export class UserService {
  // Criar usuário (quando se registra via Supabase)
  static async createUser(data: CreateUserData) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert({
          id: data.id,
          email: data.email,
          name: data.name,
          avatar_url: data.avatar_url,
          phone: data.phone,
        })
        .select('*')
        .single();

      if (error) throw error;

      return user;
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  // Buscar usuário por ID
  static async getUserById(id: string) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          profile: user_profiles (*),
          sessions: user_sessions (
            *
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return user;
    } catch (error) {
      throw new Error(`Failed to get user by id: ${error}`);
    }
  }

  // Buscar usuário por email
  static async getUserByEmail(email: string) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          profile: user_profiles (*)
        `)
        .eq('email', email)
        .single();

      if (error) throw error;

      return user;
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error}`);
    }
  }

  // Atualizar usuário
  static async updateUser(id: string, data: UpdateUserData) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({
          ...data,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return user;
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  // Criar perfil do usuário
  static async createUserProfile(data: CreateUserProfileData) {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: data.user_id,
          bio: data.bio,
          company: data.company,
          website: data.website,
          location: data.location,
          theme: data.theme || 'light',
          language: data.language || 'pt-BR',
          timezone: data.timezone || 'America/Sao_Paulo',
        })
        .select('*')
        .single();

      if (error) throw error;

      return profile;
    } catch (error) {
      throw new Error(`Failed to create user profile: ${error}`);
    }
  }

  // Atualizar perfil do usuário
  static async updateUserProfile(user_id: string, data: UpdateUserProfileData) {
    try {
      const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          user_id,
          ...data,
          theme: data.theme || 'light',
          language: data.language || 'pt-BR',
          timezone: data.timezone || 'America/Sao_Paulo',
        })
        .select('*')
        .single();

      if (error) throw error;

      return profile;
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error}`);
    }
  }

  // Registrar sessão do usuário
  static async createUserSession(user_id: string, ip_address?: string, user_agent?: string) {
    try {
      const { data: session, error } = await supabaseAdmin
        .from('user_sessions')
        .insert({
          user_id,
          ip_address,
          user_agent,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        })
        .select('*')
        .single();

      if (error) throw error;

      return session;
    } catch (error) {
      throw new Error(`Failed to create user session: ${error}`);
    }
  }

  // Registrar atividade do usuário
  static async logActivity(user_id: string, action: string, details?: any, ip_address?: string, user_agent?: string) {
    try {
      const { data: activity, error } = await supabaseAdmin
        .from('activity_logs')
        .insert({
          user_id,
          action,
          details: details || undefined,
          ip_address,
          user_agent,
        })
        .select('*')
        .single();

      if (error) throw error;

      return activity;
    } catch (error) {
      throw new Error(`Failed to log activity: ${error}`);
    }
  }

  // Criar ou atualizar usuário automaticamente (webhook do Supabase)
  static async upsertUser(data: CreateUserData) {
    try {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .upsert({
          id: data.id,
          email: data.email,
          name: data.name,
          avatar_url: data.avatar_url,
          phone: data.phone,
        })
        .select('*')
        .single();

      if (error) throw error;

      return user;
    } catch (error) {
      throw new Error(`Failed to upsert user: ${error}`);
    }
  }
}

export default UserService;
