import { useState } from 'react';
import CheckoutComponent from '../payments/CheckoutComponent';

interface DivorcioExpressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DivorcioExpressModal({ isOpen, onClose }: DivorcioExpressModalProps) {
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        {showCheckout ? (
          <CheckoutComponent
            value={759} // Valor atualizado para R$ 759,00
            productName="Divórcio Consensual"
            productDescription="Serviço de divórcio consensual simples e 100% guiado."
            customerId="example-customer-id" // Replace with actual customer ID
            onSuccess={(paymentId, status, paymentData) => {
              console.log('Pagamento bem-sucedido:', paymentId, status, paymentData);
              setShowCheckout(false);
              onClose();
            }}
            onError={(errorMessage) => {
              console.error('Erro no pagamento:', errorMessage);
            }}
            onCancel={() => {
              console.log('Pagamento cancelado');
              setShowCheckout(false);
            }}
          />
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">Divórcio Consensual simples e 100% guiado</h2>
            <div className="mb-4">
              <div className="w-full aspect-video bg-gray-200 flex items-center justify-center">
                <span>Vídeo explicativo</span>
              </div>
            </div>
            <ul className="list-disc list-inside mb-4">
              <li>Passo a passo automático conforme seu caso.</li>
              <li>Conferência de documentos e geração da minuta do acordo.</li>
              <li>Acompanhamento por status e notificações.</li>
              <li>Orientação sobre cartório/foro, assinaturas digitais e prazos.</li>
            </ul>
            <button
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              onClick={() => setShowCheckout(true)}
            >
              Contratar agora
            </button>
            <button
              className="w-full mt-2 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
              onClick={onClose}
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
