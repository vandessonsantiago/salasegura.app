import { useState } from 'react';
import CheckoutComponent from '../payments/CheckoutComponent';
import { useDivorce } from '@/contexts/DivorceContext';
import { useAuth } from '@/contexts/AuthContext';

interface DivorcioExpressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DivorcioExpressModal({ isOpen, onClose }: DivorcioExpressModalProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const { createCase, updatePaymentInfo } = useDivorce();
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        {showCheckout ? (
          <CheckoutComponent
            value={759}
            productName="Divórcio Express"
            productDescription="Serviço de divórcio consensual simples e 100% guiado."
            customerId={user?.id || ''}
            agendamentoId={currentCaseId || undefined}
            onSuccess={async (paymentId, status, paymentData) => {
              console.log('Pagamento bem-sucedido:', paymentId, status, paymentData);

              // Atualizar informações de pagamento no caso
              if (currentCaseId && paymentData) {
                await updatePaymentInfo(currentCaseId, {
                  paymentId,
                  qrCodePix: paymentData.qrCode || '',
                  copyPastePix: paymentData.copyPaste || '',
                  pixExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });
              }

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
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    Divórcio Consensual
                  </h2>
                  <p className="text-gray-600 mt-2">
                    Simples e 100% guiado
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-3 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh] px-8 py-6">
              {/* Vídeo explicativo */}
              <div className="mb-8">
                <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border border-gray-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-600 font-medium">Vídeo explicativo</span>
                  </div>
                </div>
              </div>

              {/* Benefícios */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  O que você recebe:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Passo a passo automático conforme seu caso</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Conferência de documentos e geração da minuta do acordo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Acompanhamento por status e notificações</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">Orientação sobre cartório/foro, assinaturas digitais e prazos</span>
                  </li>
                </ul>
              </div>

              {/* Preço */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-200">
                <div className="text-center">
                  <div className="text-sm text-green-700 font-medium mb-2">Valor do serviço</div>
                  <div className="text-3xl font-bold text-green-800">R$ 759,00</div>
                  <div className="text-sm text-green-600 mt-1">Pagamento único e seguro</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-8 py-10 border-t border-gray-200">
              <div className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-8 justify-center">
                  <button
                    onClick={onClose}
                    className="flex-1 px-8 py-4 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium text-base"
                  >
                    Fechar
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                    onClick={async () => {
                      if (!user) return;

                      // Criar caso de divórcio
                      const newCase = await createCase();
                      if (newCase) {
                        setCurrentCaseId(newCase.id);
                        setShowCheckout(true);
                      }
                    }}
                  >
                    Contratar agora
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
