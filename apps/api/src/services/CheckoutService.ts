import { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { AgendamentoService, AgendamentoData } from '../agendamentos';
import { DivorceService } from '../divorce';
import { createCalendarEvent, updateCalendarEvent } from './google-calendar';
import * as dotenv from 'dotenv';

// Garantir que o dotenv seja carregado
dotenv.config();

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

// Interface para dados do cliente
export interface ClienteData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string; // 🔧 CORREÇÃO: Tornar phone opcional para compatibilidade
}

// Interface para dados do checkout
export interface CheckoutData {
  cliente: ClienteData;
  valor: number;
  descricao: string;
  serviceType: string;
  serviceData?: any;
  data?: string;
  horario?: string;
  userId?: string;
  // 🔧 CORREÇÃO: Adicionar campos para dados do calendário
  calendarEventId?: string;
  googleMeetLink?: string;
}

// Interface para resposta do checkout
export interface CheckoutResponse {
  success: boolean;
  agendamentoId?: string;
  paymentId?: string;
  qrCodePix?: string;
  copyPastePix?: string;
  pixExpiresAt?: string;
  error?: string;
}

export class CheckoutService {
  private static readonly ASAAS_CONFIG = {
    BASE_URL: "https://api-sandbox.asaas.com/v3",
    API_KEY: process.env.ASAAS_API_KEY || "",
  };

  /**
   * Método principal que processa o checkout completo baseado no serviceType
   */
  static async processarCheckoutCompleto(
    req: AuthenticatedRequest,
    checkoutData: CheckoutData
  ): Promise<CheckoutResponse> {
    try {
      console.log("🎯 [CHECKOUT] 🔍 DEBUG: processarCheckoutCompleto INICIADO");
      console.log("📋 [CHECKOUT] Service Type:", checkoutData.serviceType);
      console.log("👤 [CHECKOUT] User ID:", checkoutData.userId);

      // Roteamento baseado no serviceType
      if (checkoutData.serviceType === 'divorcio') {
        return await CheckoutService.processarCheckoutDivorcio(req, checkoutData);
      } else if (checkoutData.serviceType === 'agendamento') {
        return await CheckoutService.processarCheckoutAgendamento(req, checkoutData);
      } else {
        // Fallback para agendamento (compatibilidade)
        console.log("⚠️ [CHECKOUT] ServiceType não reconhecido, usando agendamento como fallback");
        return await CheckoutService.processarCheckoutAgendamento(req, checkoutData);
      }
    } catch (error) {
      console.error('❌ [CHECKOUT] Erro inesperado no processo consolidado:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Processa checkout específico para divórcios
   */
  private static async processarCheckoutDivorcio(
    req: AuthenticatedRequest,
    checkoutData: CheckoutData
  ): Promise<CheckoutResponse> {
    try {
      console.log("🏛️ [DIVORCIO] Processando checkout de divórcio...");

      // 1. Criar caso de divórcio na tabela divorce_cases
      const divorceResult = await DivorceService.criarCasoDivorcio(
        checkoutData.userId || req.user?.id || '',
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao,
        checkoutData.serviceData
      );

      if (!divorceResult.success || !divorceResult.caseId) {
        throw new Error(divorceResult.error || 'Falha ao criar caso de divórcio');
      }

      console.log("✅ [DIVORCIO] Caso criado:", divorceResult.caseId);

      // 2. Processar pagamento
      const paymentResult = await CheckoutService.processarPagamentoAsaas(
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao,
        divorceResult.caseId!
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Falha no processamento do pagamento');
      }

      // 3. Atualizar caso com dados do pagamento
      await DivorceService.atualizarComDadosPagamento(divorceResult.caseId!, {
        paymentId: paymentResult.paymentId!,
        qrCodePix: paymentResult.qrCodePix!,
        copyPastePix: paymentResult.copyPastePix!,
        pixExpiresAt: paymentResult.pixExpiresAt!,
      });

      console.log("✅ [DIVORCIO] Checkout de divórcio processado com sucesso");

      return {
        success: true,
        agendamentoId: divorceResult.caseId,
        paymentId: paymentResult.paymentId,
        qrCodePix: paymentResult.qrCodePix,
        copyPastePix: paymentResult.copyPastePix,
        pixExpiresAt: paymentResult.pixExpiresAt,
      };
    } catch (error) {
      console.error('❌ [DIVORCIO] Erro no checkout de divórcio:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
  }

  /**
   * Processa checkout específico para agendamentos
   */
  private static async processarCheckoutAgendamento(
    req: AuthenticatedRequest,
    checkoutData: CheckoutData
  ): Promise<CheckoutResponse> {
    try {
      console.log("📅 [AGENDAMENTO] Processando checkout de agendamento...");

      // 1. Criar agendamento na tabela agendamentos
      const agendamentoResult = await AgendamentoService.criarAgendamentoBasico(
        checkoutData.userId || req.user?.id || '',
        'agendamento',
        checkoutData.valor,
        checkoutData.descricao,
        checkoutData.serviceData,
        checkoutData.data,
        checkoutData.horario
      );

      if (!agendamentoResult.success || !agendamentoResult.agendamento) {
        throw new Error(agendamentoResult.error || 'Falha ao criar agendamento');
      }

      console.log("✅ [AGENDAMENTO] Agendamento criado:", agendamentoResult.agendamento.id);

      // 2. Processar pagamento
      console.log("🔍 [DEBUG] Antes de chamar processarPagamentoAsaas");
      const paymentResult = await CheckoutService.processarPagamentoAsaas(
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao,
        agendamentoResult.agendamento.id!,
        checkoutData.userId || req.user?.id
      );

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Falha no processamento do pagamento');
      }

      // 3. Atualizar agendamento com dados do pagamento
      console.log("🔍 [DEBUG] Antes de chamar atualizarComDadosPagamento");
      console.log("🔍 [DEBUG] Dados para atualizar:", {
        agendamentoId: agendamentoResult.agendamento.id,
        paymentId: paymentResult.paymentId,
        paymentStatus: 'PENDING',
        hasQrCode: !!paymentResult.qrCodePix,
        hasCopyPaste: !!paymentResult.copyPastePix,
        hasExpiresAt: !!paymentResult.pixExpiresAt,
      });

      await AgendamentoService.atualizarComDadosPagamento(agendamentoResult.agendamento.id!, {
        paymentId: paymentResult.paymentId!,
        paymentStatus: 'PENDING',
        qrCodePix: paymentResult.qrCodePix!,
        copyPastePix: paymentResult.copyPastePix!,
        pixExpiresAt: paymentResult.pixExpiresAt!,
      });

      console.log("🔍 [DEBUG] atualizarComDadosPagamento chamado com sucesso");

      console.log("✅ [AGENDAMENTO] Checkout de agendamento processado com sucesso");

      // DEBUG: Verificar se chegamos até aqui
      console.log('🔍 [DEBUG] Antes de iniciar operações pós-checkout', {
        agendamentoId: agendamentoResult.agendamento.id,
        hasData: !!checkoutData.data,
        hasHorario: !!checkoutData.horario
      });

      // Executar operações adicionais em background (não afetam o sucesso do checkout)
      console.log('🔄 [CHECKOUT] Iniciando operações pós-checkout...', {
        agendamentoId: agendamentoResult.agendamento.id,
        hasData: !!checkoutData.data,
        hasHorario: !!checkoutData.horario,
        data: checkoutData.data,
        horario: checkoutData.horario
      });

      // DEBUG: Executar operações pós-checkout de forma síncrona para debug
      console.log('🔄 [DEBUG] Iniciando chamada para executarOperacoesPosCheckout...');
      try {
        console.log('🔄 [DEBUG] Chamando executarOperacoesPosCheckout com agendamentoId:', agendamentoResult.agendamento.id);
        await CheckoutService.executarOperacoesPosCheckout(agendamentoResult.agendamento.id!, checkoutData);
        console.log('✅ [DEBUG] Operações pós-checkout concluídas com sucesso');
      } catch (error) {
        console.error('❌ [DEBUG] Erro em operações pós-checkout:', error);
        console.error('❌ [DEBUG] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        // Não lançar erro - essas operações são opcionais
      }

      return {
        success: true,
        agendamentoId: agendamentoResult.agendamento.id,
        paymentId: paymentResult.paymentId,
        qrCodePix: paymentResult.qrCodePix,
        copyPastePix: paymentResult.copyPastePix,
        pixExpiresAt: paymentResult.pixExpiresAt,
      };
    } catch (error) {
      console.error('❌ [AGENDAMENTO] Erro no checkout de agendamento:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
  }

  /**
   * Processa o pagamento no Asaas e obtém dados do PIX
   */
  public static async processarPagamentoAsaas(
    cliente: ClienteData,
    valor: number,
    descricao: string,
    referenceId: string,
    userId?: string
  ): Promise<{
    success: boolean;
    paymentId?: string;
    qrCodePix?: string;
    copyPastePix?: string;
    pixExpiresAt?: string;
    error?: string;
  }> {
    try {
      console.log("💰 [PAGAMENTO] 🔍 DEBUG: processarPagamentoAsaas EXECUTADO!");
      console.log("💰 [PAGAMENTO] Processando pagamento no Asaas...");
      console.log("👤 [PAGAMENTO] Cliente:", cliente.name);
      console.log("💵 [PAGAMENTO] Valor:", valor);
      console.log("📝 [PAGAMENTO] Descrição:", descricao);

      // Criar cliente no Asaas
      let customerId: string;
      try {
        const customerData: any = {
          name: cliente.name,
          email: cliente.email,
          cpfCnpj: cliente.cpfCnpj,
        };

        // Adicionar telefone apenas se estiver definido e não vazio
        if (cliente.phone && cliente.phone.trim() !== "") {
          customerData.phone = cliente.phone;
        }

        const customerResponse = await axios.post(
          `${CheckoutService.ASAAS_CONFIG.BASE_URL}/customers`,
          customerData,
          {
            headers: {
              'Content-Type': 'application/json',
              'access_token': CheckoutService.ASAAS_CONFIG.API_KEY,
            },
          }
        );

        customerId = customerResponse.data.id;
        console.log("✅ [PAGAMENTO] Cliente criado no Asaas:", customerId);
      } catch (createError: any) {
        console.error("❌ [PAGAMENTO] Erro ao criar cliente no Asaas:");
        console.error("   Status:", createError.response?.status);
        console.error("   Dados do erro:", createError.response?.data);
        console.error("   Erros específicos:", createError.response?.data?.errors);
        console.error("   Dados enviados:", {
          name: cliente.name,
          email: cliente.email,
          cpfCnpj: cliente.cpfCnpj,
          phone: cliente.phone,
        });
        throw new Error(`Falha ao criar cliente no Asaas: ${createError.response?.data?.errors?.[0]?.description || createError.message}`);
      }

      // Criar cobrança PIX
      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // tomorrow
      const paymentResponse = await axios.post(
        `${CheckoutService.ASAAS_CONFIG.BASE_URL}/payments`,
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
            'Content-Type': 'application/json',
            'access_token': CheckoutService.ASAAS_CONFIG.API_KEY,
          },
        }
      );

      const paymentId = paymentResponse.data.id;
      console.log("✅ [PAGAMENTO] Pagamento criado:", paymentId);

      // Obter dados do PIX
      const pixResponse = await axios.get(
        `${CheckoutService.ASAAS_CONFIG.BASE_URL}/payments/${paymentId}/pixQrCode`,
        {
          headers: {
            'access_token': CheckoutService.ASAAS_CONFIG.API_KEY,
          },
        }
      );

      const pixData = pixResponse.data;
      console.log("✅ [PAGAMENTO] Dados PIX obtidos");

      // Inserir dados do pagamento na tabela payments do Supabase
      const { supabaseAdmin } = require('../lib/supabase');
      const paymentRecordId = randomUUID();

      try {
        const { error: insertError } = await supabaseAdmin
          .from('payments')
          .insert({
            id: paymentRecordId,
            asaas_id: paymentId,
            status: 'PENDING',
            valor: valor,
            user_id: userId || 'ac963a9a-57b0-4996-8d2b-1d70faf5564d', // Usar userId passado ou usuário válido existente
            agendamento_id: referenceId,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ [PAGAMENTO] Erro ao inserir dados na tabela payments:', insertError);
          // Não falhar o checkout por causa disso, apenas logar
        } else {
          console.log('✅ [PAGAMENTO] Dados inseridos na tabela payments:', paymentRecordId);
        }
      } catch (dbError) {
        console.error('❌ [PAGAMENTO] Erro ao salvar dados do pagamento no banco:', dbError);
        // Não falhar o checkout por causa disso
      }

      return {
        success: true,
        paymentId: paymentId, // ✅ Agora retorna o asaas_id correto para a foreign key
        qrCodePix: pixData.encodedImage,
        copyPastePix: pixData.payload,
        pixExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      console.error('❌ [PAGAMENTO] Erro no processamento do pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro no processamento do pagamento'
      };
    }
  }

  /**
   * Executa operações adicionais após o checkout ser processado com sucesso
   * Essas operações são opcionais e não afetam o resultado do checkout
   */
  private static async executarOperacoesPosCheckout(
    agendamentoId: string,
    checkoutData: CheckoutData
  ): Promise<void> {
    try {
      console.log('🚀 [DEBUG] executarOperacoesPosCheckout CHAMADO!', {
        agendamentoId,
        clienteNome: checkoutData.cliente.name,
        clienteEmail: checkoutData.cliente.email,
        hasData: !!checkoutData.data,
        hasHorario: !!checkoutData.horario,
        data: checkoutData.data,
        horario: checkoutData.horario,
        calendarEventId: checkoutData.calendarEventId,
        googleMeetLink: checkoutData.googleMeetLink
      });

      console.log('🔄 [PÓS-CHECKOUT] Iniciando operações adicionais...', {
        agendamentoId,
        clienteNome: checkoutData.cliente.name,
        clienteEmail: checkoutData.cliente.email,
        hasData: !!checkoutData.data,
        hasHorario: !!checkoutData.horario,
        data: checkoutData.data,
        horario: checkoutData.horario
      });

      // 1. Atualizar agendamento com dados do cliente
      console.log('📝 [PÓS-CHECKOUT] Atualizando dados do cliente...');
      const clienteUpdateResult = await AgendamentoService.atualizarComDadosCliente(
        agendamentoId,
        {
          nome: checkoutData.cliente.name,
          email: checkoutData.cliente.email,
          telefone: checkoutData.cliente.phone || "", // 🔧 CORREÇÃO: Usar string vazia se phone for undefined
        }
      );

      if (!clienteUpdateResult.success) {
        console.error('❌ [PÓS-CHECKOUT] Falha ao atualizar dados do cliente:', clienteUpdateResult.error);
      } else {
        console.log('✅ [PÓS-CHECKOUT] Dados do cliente atualizados');
      }

      // 2. Verificar e atualizar dados do calendário
      if (checkoutData.data && checkoutData.horario) {
        console.log('📅 [PÓS-CHECKOUT] Verificando dados do calendário...');

        // 🔧 CORREÇÃO: Usar dados recebidos do frontend se disponíveis
        if (checkoutData.calendarEventId && checkoutData.googleMeetLink) {
          console.log('✅ [PÓS-CHECKOUT] Usando dados do calendário recebidos do frontend:', {
            calendarEventId: checkoutData.calendarEventId,
            googleMeetLink: checkoutData.googleMeetLink
          });

          // 3. Atualizar agendamento com dados do calendário recebidos
          const calendarUpdateResult = await AgendamentoService.atualizarComDadosCalendario(
            agendamentoId,
            {
              calendar_event_id: checkoutData.calendarEventId,
              google_meet_link: checkoutData.googleMeetLink,
              google_meet_link_type: 'google_meet',
            }
          );

          if (!calendarUpdateResult.success) {
            console.error('❌ [PÓS-CHECKOUT] Falha ao atualizar dados do calendário:', calendarUpdateResult.error);
          } else {
            console.log('✅ [PÓS-CHECKOUT] Dados do calendário atualizados com sucesso');
          }
        } else {
          console.log('⚠️ [PÓS-CHECKOUT] Dados do calendário não recebidos do frontend, pulando atualização');
        }
      } else {
        console.log('⚠️ [PÓS-CHECKOUT] Data ou horário não disponíveis, pulando atualização do calendário');
      }

      console.log('✅ [PÓS-CHECKOUT] Operações adicionais concluídas');
    } catch (error: any) {
      console.error('❌ [PÓS-CHECKOUT] Erro inesperado em operações pós-checkout:', {
        message: error.message,
        stack: error.stack,
        agendamentoId,
        clienteNome: checkoutData?.cliente?.name
      });
      // Não lançar erro - essas operações são opcionais
    }
  }
}