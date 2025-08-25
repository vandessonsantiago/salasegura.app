import { PrismaClient, User, UserProfile } from '../generated/prisma';

const prisma = new PrismaClient();

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
  static async createUser(data: CreateUserData): Promise<User> {
    try {
      return await prisma.user.create({
        data: {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar_url: data.avatar_url,
          phone: data.phone,
        },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create user: ${error}`);
    }
  }

  // Buscar usuário por ID
  static async getUserById(id: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
          sessions: {
            where: {
              expires_at: {
                gte: new Date(),
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to get user by id: ${error}`);
    }
  }

  // Buscar usuário por email
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to get user by email: ${error}`);
    }
  }

  // Atualizar usuário
  static async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date(),
        },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to update user: ${error}`);
    }
  }

  // Criar perfil do usuário
  static async createUserProfile(data: CreateUserProfileData): Promise<UserProfile> {
    try {
      return await prisma.userProfile.create({
        data: {
          user_id: data.user_id,
          bio: data.bio,
          company: data.company,
          website: data.website,
          location: data.location,
          theme: data.theme || 'light',
          language: data.language || 'pt-BR',
          timezone: data.timezone || 'America/Sao_Paulo',
        },
      });
    } catch (error) {
      throw new Error(`Failed to create user profile: ${error}`);
    }
  }

  // Atualizar perfil do usuário
  static async updateUserProfile(user_id: string, data: UpdateUserProfileData): Promise<UserProfile> {
    try {
      return await prisma.userProfile.upsert({
        where: { user_id },
        create: {
          user_id,
          ...data,
          theme: data.theme || 'light',
          language: data.language || 'pt-BR',
          timezone: data.timezone || 'America/Sao_Paulo',
        },
        update: {
          ...data,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error}`);
    }
  }

  // Registrar sessão do usuário
  static async createUserSession(user_id: string, ip_address?: string, user_agent?: string) {
    try {
      return await prisma.userSession.create({
        data: {
          user_id,
          ip_address,
          user_agent,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      });
    } catch (error) {
      throw new Error(`Failed to create user session: ${error}`);
    }
  }

  // Registrar atividade do usuário
  static async logActivity(user_id: string, action: string, details?: any, ip_address?: string, user_agent?: string) {
    try {
      return await prisma.activityLog.create({
        data: {
          user_id,
          action,
          details: details || undefined,
          ip_address,
          user_agent,
        },
      });
    } catch (error) {
      throw new Error(`Failed to log activity: ${error}`);
    }
  }

  // Criar ou atualizar usuário automaticamente (webhook do Supabase)
  static async upsertUser(data: CreateUserData): Promise<User> {
    try {
      return await prisma.user.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          email: data.email,
          name: data.name,
          avatar_url: data.avatar_url,
          phone: data.phone,
        },
        update: {
          email: data.email,
          name: data.name,
          avatar_url: data.avatar_url,
          phone: data.phone,
          updated_at: new Date(),
        },
        include: {
          profile: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to upsert user: ${error}`);
    }
  }
}

export default UserService;
