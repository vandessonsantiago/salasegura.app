import express, { Request, Response } from "express";
import crypto from "crypto";
import { supabaseAdmin as supabase } from "../lib/supabase";
import { PrismaClient } from "../generated/prisma";

const router = express.Router();
const prisma = new PrismaClient();

interface ConversionRequest {
  name: string;
  email: string;
  whatsapp: string;
}

interface ConversionData {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  access_token: string;
  status: 'pending' | 'completed';
  created_at: string;
}

/**
 * POST /conversions - Processar formulário de conversão do chat
 * Cria um token de acesso para registro seguro de novos usuários
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, whatsapp }: ConversionRequest = req.body;

    // Validação básica
    if (!name || !email || !whatsapp) {
      return res.status(400).json({
        success: false,
        error: "Todos os campos são obrigatórios (name, email, whatsapp)",
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Formato de email inválido",
      });
    }

    console.log('🔍 Processando conversão para:', { name, email, whatsapp });

    // TEMPORÁRIO: Pular verificação de usuário existente para testar inserção na tabela
    console.log('⚠️  TESTE: Pulando verificação de usuário existente...');

    // Gerar token de acesso único
    const accessToken = crypto.randomBytes(32).toString("hex");
    console.log('📧 Token gerado:', accessToken.substring(0, 8) + '...');

    // Inserir dados na tabela conversions usando Prisma
    console.log('💾 Inserindo conversão via Prisma...');
    
    try {
      const conversion = await prisma.conversion.create({
        data: {
          name,
          email,
          whatsapp,
          access_token: accessToken,
          status: 'pending'
        }
      });

      if (!conversion) {
        console.error('❌ Erro: Conversão não foi criada');
        return res.status(500).json({
          success: false,
          error: "Erro ao processar conversão",
        });
      }

      console.log('✅ Conversão criada com sucesso:', conversion.id);

      // URL de frontend (ajustar conforme ambiente)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/register?token=${accessToken}`;

      // Retornar sucesso com token de acesso
      res.status(201).json({
        success: true,
        message: "Conversão processada com sucesso",
        accessToken,
        redirectUrl,
        conversionId: conversion.id
      });

    } catch (prismaError) {
      console.error('❌ Erro do Prisma ao inserir conversão:', prismaError);
      return res.status(500).json({
        success: false,
        error: "Erro ao processar conversão",
      });
    }

  } catch (error) {
    console.error('❌ Erro no processamento da conversão:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

/**
 * GET /conversions/:token - Validar token de acesso
 * Usado pela página de registro para validar o token
 */
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token não fornecido",
      });
    }

    console.log('🔍 Validando token:', token.substring(0, 8) + '...');

    // Buscar conversão pelo token usando Prisma
    const conversion = await prisma.conversion.findFirst({
      where: {
        access_token: token,
        status: 'pending'
      }
    });

    if (!conversion) {
      console.log('❌ Token inválido ou expirado');
      return res.status(404).json({
        success: false,
        error: "Token inválido ou expirado",
      });
    }

    console.log('✅ Token válido para:', conversion.email);

    // Retornar dados da conversão (sem token por segurança)
    res.json({
      success: true,
      conversion: {
        id: conversion.id,
        name: conversion.name,
        email: conversion.email,
        whatsapp: conversion.whatsapp,
        status: conversion.status,
        createdAt: conversion.created_at,
      },
    });

  } catch (error) {
    console.error('❌ Erro ao validar token:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

/**
 * PATCH /conversions/:token/complete - Marcar conversão como concluída
 * Chamado após criação bem-sucedida da conta
 */
router.patch('/:token/complete', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token não fornecido",
      });
    }

    console.log('🔄 Marcando conversão como concluída:', token.substring(0, 8) + '...');

    // Atualizar status da conversão usando Prisma
    const conversion = await prisma.conversion.updateMany({
      where: {
        access_token: token,
        status: 'pending'
      },
      data: {
        status: 'completed'
      }
    });

    if (conversion.count === 0) {
      return res.status(404).json({
        success: false,
        error: "Token inválido ou já utilizado",
      });
    }

    console.log('✅ Conversão marcada como concluída');

    res.json({
      success: true,
      message: "Conversão marcada como concluída",
    });

  } catch (error) {
    console.error('❌ Erro ao completar conversão:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

/**
 * POST /conversions/:token/signup - Criar usuário com token válido
 * Cria conta no Supabase sem verificação de email usando Service Role Key
 */
router.post('/:token/signup', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log('🔐 Tentativa de criação de usuário com token:', token?.substring(0, 8) + '...');

    // Validação básica
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Senha deve ter pelo menos 8 caracteres",
      });
    }

    // Buscar conversão pelo token
    const conversion = await prisma.conversion.findUnique({
      where: { 
        access_token: token,
        status: 'pending' // Apenas conversões pendentes
      }
    });

    if (!conversion) {
      return res.status(404).json({
        success: false,
        error: "Token inválido ou já utilizado",
      });
    }

    console.log('✅ Token válido, criando usuário para:', conversion.email);

    // Criar usuário no Supabase usando Service Role Key (sem verificação de email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: conversion.email,
      password: password,
      email_confirm: true, // Marcar email como confirmado
      user_metadata: {
        name: conversion.name,
        whatsapp: conversion.whatsapp,
        conversion_id: conversion.id
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Supabase:', authError);
      
      // Verificar se é erro de email já existente
      if (authError.message?.toLowerCase().includes('already') || authError.message?.toLowerCase().includes('exists')) {
        return res.status(409).json({
          success: false,
          error: "email_exists",
          message: "Este email já possui uma conta cadastrada"
        });
      }
      
      throw authError;
    }

    console.log('✅ Usuário criado com sucesso:', authData.user?.id);

    // Marcar conversão como concluída
    await prisma.conversion.update({
      where: { id: conversion.id },
      data: { status: 'completed' }
    });

    res.json({
      success: true,
      message: "Usuário criado com sucesso",
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        name: conversion.name
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

export default router;
