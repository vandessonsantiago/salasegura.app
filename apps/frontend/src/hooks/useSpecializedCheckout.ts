"use client"

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface CheckoutFormData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
}

export interface PixData {
  id?: string; // id do pagamento (paymentId)
  qrCode: string;
  copyPaste: string;
  expiresAt: string;
}

// Hook específico para checkout de divórcios
export function useDivorceCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
  });
  const [paymentData, setPaymentData] = useState<PixData | null>(null);

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const { user, session } = useAuth();

  const generatePix = async (value: number, serviceData?: any): Promise<PixData> => {
    setIsLoading(true);
    try {
      console.log("🎯 [FRONTEND] Gerando PIX para divórcio...");
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
          description: "Divórcio Express - SalaSegura",
          serviceType: "divorcio", // Tipo específico do serviço
          serviceData: serviceData || {
            // Dados específicos do divórcio podem ser adicionados aqui
          },
          userId: user?.id || "", // Adicionar userId ao payload
        };

        console.log("📤 [FRONTEND] Payload para divórcio:");
        console.log("👤 [FRONTEND] Customer:", payload.customer);
        console.log("💰 [FRONTEND] Value:", payload.value);
        console.log("🏛️ [FRONTEND] Service Type:", payload.serviceType);

        console.log("🟢 [FRONTEND] Enviando requisição para divórcio http://localhost:8001/api/v1/checkout")
        console.log("👤 [FRONTEND] User atual:", user);
        console.log("🔑 [FRONTEND] Session atual:", session ? "Presente" : "Ausente");
        console.log("🎫 [FRONTEND] Access token:", session?.access_token ? "Presente" : "Ausente");

        const headers: Record<string, string> = { "Content-Type": "application/json" };

        // TEMPORÁRIO: Usar token de desenvolvimento se não houver sessão
        const authToken = session?.access_token || 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c';

        headers["Authorization"] = `Bearer ${authToken}`;
        console.log("🔐 [FRONTEND] Token de autenticação incluído:", authToken === 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c' ? "TOKEN DEV" : "TOKEN USER");

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
        console.log("🟢 [FRONTEND] Backend resposta recebida para divórcio");
        console.log("📋 [FRONTEND] Payment ID:", json.paymentId);
        console.log("🏛️ [FRONTEND] Agendamento ID (Case ID):", json.agendamentoId);
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
          console.error("❌ Backend returned incomplete PIX data for divorce:", {
            hasQrCode: !!pixData.qrCode,
            hasCopyPaste: !!pixData.copyPaste,
            copyPasteLength: pixData.copyPaste?.length,
            qrCodeLength: pixData.qrCode?.length
          })
          throw new Error("Dados PIX incompletos retornados pelo servidor para divórcio. Tente novamente ou entre em contato com o suporte.")
        }

        console.log("✅ PIX data from backend for divorce is valid, using it")
        setPaymentData(pixData)
        return pixData

      } catch (error) {
        console.error("❌ Erro específico do checkout de divórcio:", error);
        throw error;
      }

    } finally {
      setIsLoading(false);
    }
  };

  const resetCheckout = () => {
    setFormData({
      name: '',
      email: '',
      cpfCnpj: '',
      phone: '',
    });
    setPaymentData(null);
  };

  return {
    formData,
    paymentData,
    isLoading,
    handleInputChange,
    generatePix,
    resetCheckout,
  };
}

// Hook específico para checkout de agendamentos
export function useAppointmentCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
  });
  const [paymentData, setPaymentData] = useState<PixData | null>(null);

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const { user, session } = useAuth();

  const generatePix = async (
    value: number,
    serviceData?: any,
    data?: string,
    horario?: string
  ): Promise<PixData> => {
    setIsLoading(true);
    try {
      console.log("🎯 [FRONTEND] Gerando PIX para agendamento...");
      console.log("💰 [FRONTEND] Valor:", value);
      console.log("👤 [FRONTEND] User ID:", user?.id);
      console.log("📅 [FRONTEND] Data:", data);
      console.log("🕐 [FRONTEND] Horário:", horario);

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
          description: "Agendamento - SalaSegura",
          serviceType: "agendamento", // Tipo específico do serviço
          serviceData: serviceData || {
            // Dados específicos do agendamento podem ser adicionados aqui
          },
          data: data, // Data específica do agendamento
          horario: horario, // Horário específico do agendamento
          userId: user?.id || "", // Adicionar userId ao payload
          // 🔧 CORREÇÃO: Incluir dados do evento selecionado se fornecidos
          calendarEventId: serviceData?.calendarEventId,
          googleMeetLink: serviceData?.googleMeetLink,
        };

        console.log("📤 [FRONTEND] Payload para agendamento:");
        console.log("👤 [FRONTEND] Customer:", payload.customer);
        console.log("💰 [FRONTEND] Value:", payload.value);
        console.log("🏛️ [FRONTEND] Service Type:", payload.serviceType);
        console.log("📅 [FRONTEND] Data:", payload.data);
        console.log("🕐 [FRONTEND] Horário:", payload.horario);

        console.log("🟢 [FRONTEND] Enviando requisição para agendamento http://localhost:8001/api/v1/checkout")
        console.log("👤 [FRONTEND] User atual:", user);
        console.log("🔑 [FRONTEND] Session atual:", session ? "Presente" : "Ausente");
        console.log("🎫 [FRONTEND] Access token:", session?.access_token ? "Presente" : "Ausente");

        const headers: Record<string, string> = { "Content-Type": "application/json" };

        // TEMPORÁRIO: Usar token de desenvolvimento se não houver sessão
        const authToken = session?.access_token || 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c';

        headers["Authorization"] = `Bearer ${authToken}`;
        console.log("🔐 [FRONTEND] Token de autenticação incluído:", authToken === 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c' ? "TOKEN DEV" : "TOKEN USER");

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
        console.log("🟢 [FRONTEND] Backend resposta recebida para agendamento");
        console.log("📋 [FRONTEND] Payment ID:", json.paymentId);
        console.log("🏛️ [FRONTEND] Agendamento ID:", json.agendamentoId);
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
          console.error("❌ Backend returned incomplete PIX data for appointment:", {
            hasQrCode: !!pixData.qrCode,
            hasCopyPaste: !!pixData.copyPaste,
            copyPasteLength: pixData.copyPaste?.length,
            qrCodeLength: pixData.qrCode?.length
          })
          throw new Error("Dados PIX incompletos retornados pelo servidor para agendamento. Tente novamente ou entre em contato com o suporte.")
        }

        console.log("✅ PIX data from backend for appointment is valid, using it")
        setPaymentData(pixData)
        return pixData

      } catch (error) {
        console.error("❌ Erro específico do checkout de agendamento:", error);
        throw error;
      }

    } finally {
      setIsLoading(false);
    }
  };

  const resetCheckout = () => {
    setFormData({
      name: '',
      email: '',
      cpfCnpj: '',
      phone: '',
    });
    setPaymentData(null);
  };

  return {
    formData,
    paymentData,
    isLoading,
    handleInputChange,
    generatePix,
    resetCheckout,
  };
}

// Hook genérico mantido para compatibilidade
export function useSimpleCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
  });
  const [paymentData, setPaymentData] = useState<PixData | null>(null);

  const handleInputChange = (field: keyof CheckoutFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const { user, session } = useAuth();

  const generatePix = async (value: number): Promise<PixData> => {
    setIsLoading(true);
    try {
      console.log("🎯 [FRONTEND] Gerando PIX genérico...");
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
          serviceType: "divorcio", // Tipo padrão (pode ser alterado conforme necessidade)
          serviceData: {
            // Dados específicos do serviço podem ser adicionados aqui
          },
          userId: user?.id || "", // Adicionar userId ao payload
        };

        console.log("📤 [FRONTEND] Payload genérico:");
        console.log("👤 [FRONTEND] Customer:", payload.customer);
        console.log("💰 [FRONTEND] Value:", payload.value);
        console.log("🏛️ [FRONTEND] Service Type:", payload.serviceType);

        console.log("🟢 [FRONTEND] Enviando requisição genérica http://localhost:8001/api/v1/checkout")
        console.log("👤 [FRONTEND] User atual:", user);
        console.log("🔑 [FRONTEND] Session atual:", session ? "Presente" : "Ausente");
        console.log("🎫 [FRONTEND] Access token:", session?.access_token ? "Presente" : "Ausente");

        const headers: Record<string, string> = { "Content-Type": "application/json" };

        // TEMPORÁRIO: Usar token de desenvolvimento se não houver sessão
        const authToken = session?.access_token || 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c';

        headers["Authorization"] = `Bearer ${authToken}`;
        console.log("🔐 [FRONTEND] Token de autenticação incluído:", authToken === 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c' ? "TOKEN DEV" : "TOKEN USER");

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
        console.log("🟢 [FRONTEND] Backend resposta recebida genérica");
        console.log("📋 [FRONTEND] Payment ID:", json.paymentId);
        console.log("🏛️ [FRONTEND] Agendamento ID:", json.agendamentoId);
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

      } catch (error) {
        console.error("❌ Erro específico do checkout genérico:", error);
        throw error;
      }

    } finally {
      setIsLoading(false);
    }
  };

  const resetCheckout = () => {
    setFormData({
      name: '',
      email: '',
      cpfCnpj: '',
      phone: '',
    });
    setPaymentData(null);
  };

  return {
    formData,
    paymentData,
    isLoading,
    handleInputChange,
    generatePix,
    resetCheckout,
  };
}
