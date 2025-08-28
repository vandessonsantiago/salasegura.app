import express, { Request, Response, Router } from "express";
import crypto from "crypto";
import { supabaseAdmin as supabase } from "../lib/supabase";

const router: Router = express.Router();

interface ConversionRequest {
  name: string;
  email: string;
  whatsapp: string;
}

// Revisando e ajustando o tipo ConversionData para alinhar com a tabela no Supabase
interface ConversionData {
  id: string; // Campo obrigatório gerado pelo Supabase
  name: string;
  email: string;
  whatsapp: string;
  access_token: string;
  status: 'pending' | 'completed';
  created_at: string; // Campo obrigatório gerado pelo Supabase
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

    // Verificar se o usuário já existe no Supabase
    // Fazemos isso tentando um signup temporário e verificando o erro
    console.log('🔍 Verificando se usuário já existe...');
    
    try {
      const { data: testUser, error: existsError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'temp123456789', // Senha temporária
        email_confirm: false, // Não confirmar email
      });
      
      // Se deu erro de usuário já existente
      if (existsError && (
        existsError.message?.toLowerCase().includes('already') ||
        existsError.message?.toLowerCase().includes('exists') ||
        existsError.message?.toLowerCase().includes('registered')
      )) {
        console.log('⚠️ Usuário já existe:', email);
        return res.status(409).json({
          success: false,
          error: "email_exists", 
          message: "Este email já possui uma conta cadastrada",
          shouldShowLogin: true
        });
      }
      
      // Se foi outro erro
      if (existsError) {
        console.error('❌ Erro ao verificar usuário:', existsError);
        return res.status(500).json({
          success: false,
          error: "Erro ao processar solicitação",
        });
      }
      
      // Se chegou até aqui, usuário não existe, então deletamos o usuário temporário
      if (testUser?.user?.id) {
        await supabase.auth.admin.deleteUser(testUser.user.id);
        console.log('✅ Email disponível para novo usuário');
      }

    } catch (verificationError: any) {
      console.error('❌ Erro na verificação de usuário:', verificationError);
      return res.status(500).json({
        success: false,
        error: "Erro ao processar solicitação",
      });
    }

    // Gerar token de acesso único
    const accessToken = crypto.randomBytes(32).toString("hex");
    console.log('📧 Token gerado:', accessToken.substring(0, 8) + '...');

    // Inserir dados na tabela conversions usando Supabase
    console.log('💾 Inserindo conversão via Supabase...');
    
    try {
      const { data: conversion, error: insertError } = await supabase
        .from('conversions')
        .insert([
          {
            name,
            email,
            whatsapp,
            access_token: accessToken,
            status: 'pending'
          } as Partial<ConversionData> // Forçando a tipagem explícita como parcial
        ])
        .select() // Garantindo que o retorno seja tipado corretamente
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir conversão:', insertError);
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

    } catch (error) {
      console.error('❌ Erro ao inserir conversão:', error);
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

    // Buscar conversão pelo token usando Supabase
    const { data: conversion, error: findError } = await supabase
      .from('conversions')
      .select('*')
      .eq('access_token', token)
      .eq('status', 'pending')
      .single();

    if (findError || !conversion) {
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

    // Atualizar status da conversão usando Supabase
    const { data: conversion, error: updateError } = await supabase
      .from('conversions')
      .update({ status: 'completed' })
      .eq('access_token', token)
      .eq('status', 'pending')
      .select()
      .single();

    if (updateError || !conversion) {
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
    const { data: conversion, error: findError } = await supabase
      .from('conversions')
      .select('*')
      .eq('access_token', token)
      .eq('status', 'pending')
      .single();

    if (findError || !conversion) {
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
    await supabase
      .from('conversions')
      .update({ status: 'completed' })
      .eq('id', conversion.id);

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
