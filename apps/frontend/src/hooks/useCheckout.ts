"use client"

import { useState } from 'react';

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
  onSuccess: (paymentId: string, status: string, pixData?: { qrCode?: string; copyPaste?: string }) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export interface PixData {
  id?: string; // id do pagamento (paymentId)
  qrCode: string;
  copyPaste: string;
  expiresAt: string;
}

// Hook simplificado sem props para uso geral
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

  const { user } = require("../contexts/AuthContext").useAuth();
  const generatePix = async (value: number, agendamentoId?: string): Promise<PixData> => {
    setIsLoading(true);
    try {
      // Primeiro, tente criar pagamento real no backend (/api/v1/checkout)
      try {
        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // tomorrow YYYY-MM-DD
        const payload = {
          customer: {
            name: formData.name || "Cliente",
            email: formData.email || `cliente+${Date.now()}@example.com`,
            cpfCnpj: formData.cpfCnpj || "00000000000",
            phone: formData.phone || undefined,
          },
          billingType: "PIX",
          value,
          dueDate,
          description: "Pagamento via SalaSegura",
          userId: user?.id || "",
          agendamentoId: agendamentoId || undefined,
        };

        console.log("🟢 Checkout: enviando requisição ao backend http://localhost:8001/api/v1/checkout", payload)
        const res = await fetch("http://localhost:8001/api/v1/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const txt = await res.text()
          console.warn("🔴 Backend /api/v1/checkout retornou erro:", res.status, txt)
          throw new Error(`Backend checkout failed: ${res.status}`)
        }

        const json = await res.json()
        console.log("🟢 Backend /api/v1/checkout resposta:", json)

        const pixData: PixData = {
          id: json.id,
          qrCode: json.pixQrCode || "",
          copyPaste: json.pixCopyAndPaste || "",
          expiresAt: json.pixExpiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }

        // If backend didn't return usable pix, fallback to placeholder below
        if (!pixData.copyPaste || pixData.copyPaste.length < 20) {
          console.warn("⚠️ Backend returned empty/short copyPaste; falling back to local placeholder PIX")
        } else {
          setPaymentData(pixData)
          return pixData
        }
      } catch (err) {
        console.warn("⚠️ Erro ao gerar PIX via backend, usando placeholder local:", err)
        // fallthrough to local mock below
      }

      // Fallback local placeholder (mantido para desenvolvimento/offline)
      const pixData: PixData = {
      id: undefined,
      qrCode: `00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000520400005303986540${value.toFixed(2)}5802BR5925${formData.name.substring(0, 25)}6009SAO PAULO62070503***6304`,
      copyPaste: `00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000520400005303986540${value.toFixed(2)}5802BR5925${formData.name.substring(0, 25)}6009SAO PAULO62070503***6304`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }

      setPaymentData(pixData)
      return pixData
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
