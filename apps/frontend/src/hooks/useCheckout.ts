"use client"

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatCPF, formatPhone } from '../utils/formatters';

export interface CheckoutFormData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
}

export interface CheckoutComponentProps {
  value: number;
  productName: string;
  productDescription: string;
  customerId?: string;
  onSuccess: (paymentId: string, status: string, pixData?: { qrCode?: string; copyPaste?: string; caseId?: string }) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  initialCustomerData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface PixData {
  id?: string; // id do pagamento (paymentId)
  qrCode: string;
  copyPaste: string;
  expiresAt: string;
  caseId?: string; // 🔧 NOVO: ID do caso criado pelo checkout
}

// Hook simplificado sem props para uso geral
export function useSimpleCheckout(initialData?: {
  name?: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    cpfCnpj: initialData?.cpfCnpj || '',
    phone: initialData?.phone || '',
  });
  const [paymentData, setPaymentData] = useState<PixData | null>(null);

  // Usar ref para controlar se já foi inicializado
  const isInitialized = useRef(false);

  // Atualizar dados apenas uma vez quando o componente montar
  useEffect(() => {
    if (initialData && !isInitialized.current) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
      isInitialized.current = true;
    }
  }, []); // Dependência vazia para executar apenas uma vez

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    let formattedValue = value;

    // Aplicar máscaras automaticamente
    if (field === 'cpfCnpj') {
      formattedValue = formatCPF(value);
    } else if (field === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

    const { user, session } = useAuth();
  const generatePix = async (value: number): Promise<PixData> => {
    setIsLoading(true);
    try {
      console.log("🎯 [FRONTEND] ===== INÍCIO DO GERAR PIX =====");
      console.log("💰 [FRONTEND] Valor:", value);
      console.log("👤 [FRONTEND] User ID:", user?.id);
      // Primeiro, tente criar pagamento real no backend (/api/v1/checkout)
      try {
        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // tomorrow YYYY-MM-DD
        const payload: any = {
          customer: {
            name: formData.name || "Cliente",
            email: formData.email || `cliente+${Date.now()}@gmail.com`,
            cpfCnpj: formData.cpfCnpj || "91010004204", // CPF válido para teste
            phone: formData.phone ? `55${formData.phone.replace(/\D/g, '')}` : "5511987654321", // Formatar telefone
          },
          billingType: "PIX",
          value,
          dueDate,
          description: "Pagamento via SalaSegura",
          serviceType: "divorcio", // Tipo do serviço
          serviceData: {
            // Dados específicos do serviço podem ser adicionados aqui
          },
          userId: user?.id || "", // Adicionar userId ao payload
        };

        console.log("� [FRONTEND] Payload completo sendo enviado:");
        console.log("📤 [FRONTEND] Customer:", payload.customer);
        console.log("📤 [FRONTEND] Billing Type:", payload.billingType);
        console.log("📤 [FRONTEND] Value:", payload.value);
        console.log("📤 [FRONTEND] Due Date:", payload.dueDate);
        console.log("📤 [FRONTEND] User ID:", payload.userId);
        console.log("📤 [FRONTEND] Service Type:", payload.serviceType);
        console.log("📤 [FRONTEND] Service Data:", payload.serviceData);
        console.log("📤 [FRONTEND] User ID no payload:", payload.userId);

        console.log("🟢 [FRONTEND] Enviando requisição ao backend http://localhost:8001/api/v1/checkout")
        console.log("👤 [FRONTEND] User atual:", user);
        console.log("🔑 [FRONTEND] Session atual:", session ? "Presente" : "Ausente");
        console.log("🎫 [FRONTEND] Access token:", session?.access_token ? "Presente" : "Ausente");
        
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        
        // TEMPORÁRIO: Usar token de desenvolvimento se não houver sessão
        const authToken = session?.access_token || 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c';
        
        headers["Authorization"] = `Bearer ${authToken}`;
        console.log("🔐 [FRONTEND] Token de autenticação incluído na requisição:", authToken === 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c' ? "TOKEN DEV" : "TOKEN USER");
        
        const res = await fetch("http://localhost:8001/api/v1/checkout", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const txt = await res.text()
          console.warn("🔴 Backend /api/v1/checkout retornou erro:", res.status, txt)
          throw new Error(`Backend checkout failed: ${res.status}`)
        }

        const json = await res.json()
        console.log("🟢 [FRONTEND] Backend /api/v1/checkout resposta recebida");
        console.log("📋 [FRONTEND] Payment ID:", json.paymentId);
        console.log("📅 [FRONTEND] Agendamento ID:", json.agendamentoId);
        console.log("📊 [FRONTEND] Status:", json.status);
        console.log("💰 [FRONTEND] Valor:", json.value);
        console.log("📅 [FRONTEND] PIX QR Code presente:", !!json.qrCodePix);
        console.log("📋 [FRONTEND] PIX Copy&Paste presente:", !!json.copyPastePix);

        const pixData: PixData = {
          id: json.paymentId,
          qrCode: json.qrCodePix || "",
          copyPaste: json.copyPastePix || "",
          expiresAt: json.pixExpiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }

        // If backend didn't return usable pix, throw error instead of using placeholder
        if (!pixData.qrCode || !pixData.copyPaste || pixData.copyPaste.length < 10) {
          console.error("❌ Backend returned incomplete PIX data:", {
            hasQrCode: !!pixData.qrCode,
            hasCopyPaste: !!pixData.copyPaste,
            copyPasteLength: pixData.copyPaste?.length,
            qrCodeLength: pixData.qrCode?.length
          })
          throw new Error("Dados PIX incompletos retornados pelo servidor. Tente novamente ou entre em contato com o suporte.")
        }

        console.log("✅ PIX data from backend is valid, using it")
        setPaymentData(pixData)
        return pixData
      } catch (err) {
        console.error("❌ [FRONTEND] ===== ERRO NO GERAR PIX =====");
        console.error("❌ [FRONTEND] Erro completo:", err);
        console.error("❌ [FRONTEND] Tipo do erro:", err instanceof Error ? err.constructor.name : typeof err);
        console.error("❌ [FRONTEND] Mensagem:", err instanceof Error ? err.message : 'Erro desconhecido');
        throw err
      }
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetCheckout = () => {
    setPaymentData(null);
    setFormData({
      name: '',
      email: '',
      cpfCnpj: '',
      phone: '',
    });
  };

  return {
    formData,
    isLoading,
    paymentData,
    handleInputChange,
    generatePix,
    resetCheckout,
  };
}
