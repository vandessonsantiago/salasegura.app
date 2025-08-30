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

export interface PixData {
  id?: string; // id do pagamento (paymentId)
  qrCode: string;
  copyPaste: string;
  expiresAt: string;
}

// Hook específico para checkout de divórcios
export function useDivorceCheckout(initialData?: {
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

  // Atualizar telefone quando mudar (mesmo após inicialização)
  useEffect(() => {
    if (initialData?.phone && isInitialized.current) {
      setFormData(prev => ({
        ...prev,
        phone: initialData.phone || ''
      }));
    }
  }, [initialData?.phone]);

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

  const generatePix = async (value: number, serviceData?: any): Promise<PixData> => {
    setIsLoading(true);
    try {
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

        const headers: Record<string, string> = { "Content-Type": "application/json" };

        // TEMPORÁRIO: Usar token de desenvolvimento se não houver sessão
        const authToken = session?.access_token || 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c';

        headers["Authorization"] = `Bearer ${authToken}`;

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
export function useAppointmentCheckout(initialData?: {
  name?: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
}, forceUpdate?: number) {

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

  // Atualizar dados quando initialData mudar (mas apenas se ainda não foi inicializado)
  useEffect(() => {
    if (initialData && !isInitialized.current) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        cpfCnpj: initialData.cpfCnpj || '',
        phone: initialData.phone || '',
      });
      isInitialized.current = true;
    }
  }, [initialData]);

  // Atualizar telefone quando mudar (mesmo após inicialização)
  useEffect(() => {
    if (initialData?.phone && isInitialized.current) {
      setFormData(prev => ({
        ...prev,
        phone: initialData.phone || ''
      }));
    }
  }, [initialData?.phone]);

  // Forçar atualização quando forceUpdate mudar
  useEffect(() => {
    if (forceUpdate && forceUpdate > 0) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [forceUpdate, initialData]);

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

  const generatePix = async (
    value: number,
    serviceData?: any,
    data?: string,
    horario?: string
  ): Promise<PixData> => {
    setIsLoading(true);
    try {
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

        const headers: Record<string, string> = { "Content-Type": "application/json" };

        // TEMPORÁRIO: Usar token de desenvolvimento se não houver sessão
        const authToken = session?.access_token || 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c';

        headers["Authorization"] = `Bearer ${authToken}`;

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

        const headers: Record<string, string> = { "Content-Type": "application/json" };

        // TEMPORÁRIO: Usar token de desenvolvimento se não houver sessão
        const authToken = session?.access_token || 'sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c';

        headers["Authorization"] = `Bearer ${authToken}`;

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
