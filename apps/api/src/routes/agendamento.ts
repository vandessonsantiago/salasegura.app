import { Router } from 'express';
import { AgendamentosController } from '../controllers/AgendamentosController';
import { authenticateToken } from '../middleware/auth';

const router: Router = Router();

// ROTA TEMPORÁRIA PARA DEBUG - listar todos os agendamentos (SEM AUTENTICAÇÃO)
router.get('/debug', async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Consultando TODOS os agendamentos sem filtro...");
    const { supabaseAdmin } = require('../lib/supabase');

    const { data: agendamentos, error } = await supabaseAdmin
      .from("agendamentos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ Erro ao buscar agendamentos:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }

    console.log(`✅ Encontrados ${agendamentos?.length || 0} agendamentos no total`);
    if (agendamentos && agendamentos.length > 0) {
      agendamentos.forEach((agendamento: any, index: number) => {
        console.log(`📋 Agendamento ${index + 1}:`, {
          id: agendamento.id,
          user_id: agendamento.user_id,
          status: agendamento.status,
          payment_id: agendamento.payment_id,
          qr_code_pix: agendamento.qr_code_pix ? "PRESENTE" : "NULL",
          copy_paste_pix: agendamento.copy_paste_pix ? "PRESENTE" : "NULL",
          pix_expires_at: agendamento.pix_expires_at,
        });
      });
    }

    res.json({
      success: true,
      data: agendamentos,
      total: agendamentos?.length || 0
    });
  } catch (error) {
    console.error("❌ Erro na rota debug:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA TEMPORÁRIA PARA DEBUG - listar todos os pagamentos (SEM AUTENTICAÇÃO)
router.get('/payments/debug', async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Consultando TODOS os pagamentos...");
    const { supabaseAdmin } = require('../lib/supabase');

    const { data: payments, error } = await supabaseAdmin
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("❌ Erro ao buscar pagamentos:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }

    console.log(`✅ Encontrados ${payments?.length || 0} pagamentos no total`);
    if (payments && payments.length > 0) {
      payments.forEach((payment: any, index: number) => {
        console.log(`💳 Pagamento ${index + 1}:`, {
          id: payment.id,
          asaas_id: payment.asaas_id,
          status: payment.status,
          amount: payment.amount,
          created_at: payment.created_at,
        });
      });
    }

    res.json({
      success: true,
      data: payments,
      total: payments?.length || 0
    });
  } catch (error) {
    console.error("❌ Erro na rota debug payments:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// ROTA TEMPORÁRIA PARA DEBUG - testar inserção manual na tabela payments
router.post('/test-payment-insert', async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Testando inserção manual na tabela payments...");
    const { supabaseAdmin } = require('../lib/supabase');
    const { randomUUID } = require('crypto');

    const { asaas_id } = req.body;
    const testPaymentId = randomUUID();
    const testAsaasId = asaas_id || 'pay_test_' + Date.now();

    console.log('🔍 [DEBUG] Tentando inserir:', {
      id: testPaymentId,
      asaas_id: testAsaasId,
      status: 'PENDING',
      valor: 100,
      user_id: 'ac963a9a-57b0-4996-8d2b-1d70faf5564d',
      agendamento_id: 'ca96a950-5797-41c0-8f33-9f084672a8da',
    });

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        id: testPaymentId,
        asaas_id: testAsaasId,
        status: 'PENDING',
        valor: 100,
        user_id: 'ac963a9a-57b0-4996-8d2b-1d70faf5564d',
        agendamento_id: 'ca96a950-5797-41c0-8f33-9f084672a8da',
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('❌ [DEBUG] Erro na inserção manual:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error 
      });
    }

    console.log('✅ [DEBUG] Inserção manual bem-sucedida:', data);
    res.json({
      success: true,
      data: data,
      message: 'Pagamento inserido com sucesso via teste manual'
    });
  } catch (error) {
    console.error("❌ Erro no teste de inserção:", error);
    res.status(500).json({ 
      success: false, 
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : error
    });
  }
});

// ROTA TEMPORÁRIA PARA DEBUG - testar criação de cliente no Asaas
router.post('/test-asaas-client', async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Testando criação de cliente no Asaas...");
    const axios = require('axios');

    const ASAAS_CONFIG = {
      BASE_URL: "https://api-sandbox.asaas.com/v3",
      API_KEY: process.env.ASAAS_API_KEY || "",
    };

    const clienteData = {
      name: "Teste Asaas",
      email: "teste.asaas@teste.com",
      cpfCnpj: "12345678909",
      phone: "5511987654321"
    };

    console.log('🔍 [DEBUG] Enviando dados para Asaas:', clienteData);

    const response = await axios.post(
      `${ASAAS_CONFIG.BASE_URL}/customers`,
      clienteData,
      {
        headers: {
          'access_token': ASAAS_CONFIG.API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ [DEBUG] Cliente criado no Asaas:', response.data);
    res.json({
      success: true,
      data: response.data,
      message: 'Cliente criado com sucesso no Asaas'
    });
  } catch (error) {
    console.error("❌ Erro na criação do cliente Asaas:", (error as any).response?.data || (error as any).message);
    res.status(500).json({ 
      success: false, 
      error: "Erro na criação do cliente",
      details: (error as any).response?.data || (error as any).message
    });
  }
});

// ROTA TEMPORÁRIA PARA DEBUG - simular processarPagamentoAsaas
router.post('/test-payment-full', async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Simulando processarPagamentoAsaas...");
    const axios = require('axios');
    const { supabaseAdmin } = require('../lib/supabase');
    const { randomUUID } = require('crypto');

    const ASAAS_CONFIG = {
      BASE_URL: "https://api-sandbox.asaas.com/v3",
      API_KEY: process.env.ASAAS_API_KEY || "",
    };

    const cliente = {
      name: "Teste Full",
      email: "teste.full@teste.com",
      cpfCnpj: "12345678909",
      phone: "5511987654321"
    };
    const valor = 50;
    const descricao = "Teste Full Payment";
    const referenceId = "ca96a950-5797-41c0-8f33-9f084672a8da";
    const userId = "ac963a9a-57b0-4996-8d2b-1d70faf5564d";

    console.log('🔍 [DEBUG] Passo 1: Criando cliente no Asaas...');
    const customerResponse = await axios.post(
      `${ASAAS_CONFIG.BASE_URL}/customers`,
      cliente,
      {
        headers: {
          'access_token': ASAAS_CONFIG.API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const customerId = customerResponse.data.id;
    console.log('✅ [DEBUG] Cliente criado:', customerId);

    console.log('🔍 [DEBUG] Passo 2: Criando cobrança PIX...');
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const paymentResponse = await axios.post(
      `${ASAAS_CONFIG.BASE_URL}/payments`,
      {
        customer: customerId,
        billingType: 'PIX',
        value: valor,
        dueDate,
        description: descricao,
        externalReference: referenceId,
      },
      {
        headers: {
          'access_token': ASAAS_CONFIG.API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    const paymentId = paymentResponse.data.id;
    console.log('✅ [DEBUG] Cobrança criada:', paymentId);

    console.log('🔍 [DEBUG] Passo 3: Obtendo dados PIX...');
    const pixResponse = await axios.get(
      `${ASAAS_CONFIG.BASE_URL}/payments/${paymentId}/pixQrCode`,
      {
        headers: {
          'access_token': ASAAS_CONFIG.API_KEY,
        },
      }
    );
    const pixData = pixResponse.data;
    console.log('✅ [DEBUG] Dados PIX obtidos');

    console.log('🔍 [DEBUG] Passo 4: Inserindo na tabela payments...');
    const paymentRecordId = randomUUID();
    console.log('🔍 [DEBUG] Dados para inserção:', {
      id: paymentRecordId,
      asaas_id: paymentId,
      status: 'PENDING',
      valor: valor,
      user_id: userId,
      agendamento_id: referenceId,
    });

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        id: paymentRecordId,
        asaas_id: paymentId,
        status: 'PENDING',
        valor: valor,
        user_id: userId,
        agendamento_id: referenceId,
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('❌ [DEBUG] Erro na inserção:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message,
        step: 'database_insert'
      });
    }

    console.log('✅ [DEBUG] Inserção bem-sucedida:', data);

    res.json({
      success: true,
      paymentId,
      qrCodePix: pixData.encodedImage,
      copyPastePix: pixData.payload,
      pixExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      message: 'Processamento completo simulado com sucesso'
    });
  } catch (error) {
    console.error("❌ Erro no teste completo:", (error as any).response?.data || (error as any).message);
    res.status(500).json({ 
      success: false, 
      error: "Erro no processamento",
      details: (error as any).response?.data || (error as any).message
    });
  }
});

// ROTA TEMPORÁRIA PARA DEBUG - testar atualizarComDadosPagamento diretamente
router.post('/test-update-payment', async (req, res) => {
  try {
    console.log("🔍 [DEBUG] Testando atualizarComDadosPagamento diretamente...");
    const { AgendamentoService } = require('../services/AgendamentoService');

    const { agendamentoId, paymentId } = req.body;

    if (!agendamentoId || !paymentId) {
      return res.status(400).json({ error: 'agendamentoId e paymentId são obrigatórios' });
    }

    console.log('🔍 [DEBUG] Chamando atualizarComDadosPagamento com:', {
      agendamentoId,
      paymentId,
      paymentStatus: 'PENDING',
      qrCodePix: 'test_qr',
      copyPastePix: 'test_copy',
      pixExpiresAt: new Date().toISOString(),
    });

    const result = await AgendamentoService.atualizarComDadosPagamento(agendamentoId, {
      paymentId,
      paymentStatus: 'PENDING',
      qrCodePix: 'test_qr',
      copyPastePix: 'test_copy',
      pixExpiresAt: new Date().toISOString(),
    });

    console.log('✅ [DEBUG] Resultado de atualizarComDadosPagamento:', result);

    // Verificar se os dados foram salvos
    const { supabaseAdmin } = require('../lib/supabase');
    const { data: agendamento, error } = await supabaseAdmin
      .from('agendamentos')
      .select('payment_id, payment_status, qr_code_pix, copy_paste_pix, pix_expires_at')
      .eq('id', agendamentoId)
      .single();

    if (error) {
      console.error('❌ [DEBUG] Erro ao verificar agendamento:', error);
    } else {
      console.log('🔍 [DEBUG] Agendamento após atualização:', agendamento);
    }

    res.json({
      success: result.success,
      error: result.error,
      agendamentoVerificado: agendamento,
    });
  } catch (error) {
    console.error("❌ Erro no teste de atualização:", error);
    res.status(500).json({ 
      success: false, 
      error: "Erro interno", 
      details: (error as any).message 
    });
  }
});

// Aplicar middleware de autenticação em todas as rotas APÓS as rotas de debug
router.use(authenticateToken);

// Listar agendamentos do usuário
router.get('/', AgendamentosController.getUserAgendamentos);

// Criar agendamento
router.post('/', AgendamentosController.createAgendamento);

// Buscar agendamento por ID
router.get('/:id', AgendamentosController.getAgendamento);

// Atualizar agendamento
router.put('/:id', AgendamentosController.updateAgendamento);

// Deletar agendamento
router.delete('/:id', AgendamentosController.deleteAgendamento);

export default router;
