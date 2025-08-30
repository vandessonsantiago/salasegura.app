import { CheckSquare, Users, CalendarIcon, SignIn } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import CardHero from './CardHero';
import dynamic from 'next/dynamic';
import { useChecklist } from '@/contexts/ChecklistContext';
import { useAgendamentos } from '@/contexts/AgendamentosContext';
import { useDivorce } from '@/contexts/DivorceContext';
import DivorcioExpressModal from '@/components/modals/DivorcioExpressModal';

// Carregar modais dinamicamente (evita SSR issues com window)
const ChecklistModal = dynamic(() => import('@/components/modals/ChecklistModal'), { ssr: false });
const AgendamentoModal = dynamic(() => import('@/components/modals/AgendamentoModal'), { ssr: false });
const MeusAgendamentosModal = dynamic(() => import('@/components/modals/MeusAgendamentosModal'), { ssr: false });
const MeuDivorcioModal = dynamic(() => import('@/components/modals/MeuDivorcioModal'), { ssr: false });

export default function Hero() {
  const router = useRouter();
  const [showChecklist, setShowChecklist] = useState(false);
  const [showAgendamento, setShowAgendamento] = useState(false);
  const [showMeusAgendamentos, setShowMeusAgendamentos] = useState(false);
  const [showDivorcioExpressModal, setShowDivorcioExpressModal] = useState(false);
  const [showMeuDivorcioModal, setShowMeuDivorcioModal] = useState(false);
  const { sessions, currentSession } = useChecklist();
  const { hasConsultas, getLatestConsulta, formatStatus, formatDate, loading } = useAgendamentos();
  const { hasActiveCase, currentCase, formatStatus: formatDivorceStatus, loading: divorceLoading } = useDivorce();

  const handleLogin = () => {
    router.push('/login');
  };

  // Lógica do progresso do checklist:
  // - activeSession: sessão que não foi completada (sem completed_at)
  // - hasProgress: somente quando há progresso real (progress > 0)
  // - isCompleted: quando progress == total_items
  const activeSession = sessions.find(session => !session.completed_at) || currentSession;
  const hasProgress = activeSession && activeSession.total_items > 0 && activeSession.progress > 0;
  const isCompleted = activeSession && activeSession.total_items > 0 && activeSession.progress === activeSession.total_items;

  // Informações do último agendamento
  const latestConsulta = getLatestConsulta();
  const consultaStatus = latestConsulta ? formatStatus(latestConsulta.status) : null;

  return (
    <section className="py-4 w-full">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center justify-center">
        <div className="w-[calc(100vw-2rem)] max-w-xs sm:max-w-sm lg:w-56 flex-shrink-0">
          <div className="w-full aspect-[9/16] bg-black rounded-2xl flex items-center justify-center text-white text-sm shadow-lg">
            play de video
          </div>
        </div>
        <div className="w-full lg:w-96 min-w-0 px-2 lg:px-0">
          <div className="grid gap-3 lg:gap-4">
            
            {/* Card 1 - Checklist Gratuito */}
            <CardHero
              icon={<CheckSquare size={22} />}
              title='Checklist "Você está pronto(a) para o cartório?"'
              badge={!hasProgress ? { text: 'GRATUITO', variant: 'free' } : undefined}
              progress={hasProgress ? {
                current: activeSession?.progress || 0,
                total: activeSession?.total_items || 0,
                show: true
              } : undefined}
              button={{
                text: isCompleted ? 'REVISAR' : hasProgress ? 'CONTINUAR' : 'ACESSAR AGORA',
                variant: 'free',
                onClick: () => setShowChecklist(true)
              }}
            />

            {/* Card 2 - Divórcio Express ou Meu Divórcio */}
            {!divorceLoading && !hasActiveCase ? (
              <CardHero
                icon={<Users size={22} />}
                title="Divórcio Express - Simples e 100% guiado"
                price={{
                  original: "R$ 1.450,00",
                  current: "R$ 759,00"
                }}
                button={{
                  text: "RESOLVER AGORA",
                  variant: "primary",
                  onClick: () => setShowDivorcioExpressModal(true)
                }}
                highlight={true}
              />
            ) : !divorceLoading && hasActiveCase && currentCase ? (
              <CardHero
                icon={<Users size={22} />}
                title="Meu Divórcio Express"
                status={formatDivorceStatus(currentCase.status)}
                button={{
                  text: "VER MEU DIVÓRCIO",
                  variant: currentCase.status === 'payment_confirmed' ? "primary" : "secondary",
                  onClick: () => setShowMeuDivorcioModal(true)
                }}
                customContent={
                  currentCase.status === 'pending_payment' ? (
                    <div className="mt-3 text-xs text-gray-600">
                      <p className="text-orange-600 font-medium">⏳ Aguardando confirmação do pagamento</p>
                    </div>
                  ) : currentCase.status === 'payment_confirmed' ? (
                    <div className="mt-3 text-xs text-gray-600">
                      <p className="text-green-600 font-medium">✅ Pagamento confirmado - Processo iniciado</p>
                    </div>
                  ) : null
                }
              />
            ) : divorceLoading ? (
              <CardHero
                icon={<Users size={22} />}
                title="Carregando divórcio..."
                button={{
                  text: "CARREGANDO...",
                  variant: "secondary",
                  onClick: () => {}
                }}
              />
            ) : null}

            {/* Card 3 - Consulta (só aparece se NÃO tiver agendamentos E não estiver carregando) */}
            {!loading && !hasConsultas && (
              <CardHero
                icon={<CalendarIcon size={22} />}
                title="Agendar Consulta de Alinhamento Inicial"
                price={{
                  original: "R$ 759,00",
                  current: "R$ 99,00"
                }}
                button={{
                  text: "AGENDAR CONSULTA",
                  variant: "primary",
                  onClick: () => setShowAgendamento(true)
                }}
              />
            )}

            {/* Card 3 - Loading (enquanto carrega dados de agendamento) */}
            {loading && (
              <CardHero
                icon={<CalendarIcon size={22} />}
                title="Carregando agendamentos..."
                button={{
                  text: "CARREGANDO...",
                  variant: "secondary",
                  onClick: () => {}
                }}
              />
            )}

            {/* Card 3 - Meus Agendamentos (só aparece se TIVER agendamentos E não estiver carregando) */}
            {!loading && hasConsultas && latestConsulta && (
              <CardHero
                icon={<CalendarIcon size={22} />}
                title="Meus Agendamentos"
                status={consultaStatus || undefined}
                button={{
                  text: "VER AGENDAMENTOS",
                  variant: consultaStatus?.text === 'Confirmado' ? "primary" : "secondary",
                  onClick: () => setShowMeusAgendamentos(true)
                }}
                customContent={
                  <div className="mt-3 text-xs text-gray-600">
                    {latestConsulta && latestConsulta.status === 'CONFIRMED' && latestConsulta.googleMeetLink && (
                      <p className="text-green-600 font-medium">✅ Link da reunião disponível</p>
                    )}
                    {latestConsulta && latestConsulta.status === 'PENDING' && (
                      <div className="space-y-1">
                        <p className="text-yellow-600 font-medium">⏳ Aguardando pagamento PIX</p>
                        <p className="text-gray-500">Prazo: 24h • Valor: R$ {latestConsulta.valor.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>
      {showChecklist && (
        <ChecklistModal isOpen={showChecklist} onClose={() => setShowChecklist(false)} />
      )}
      {showAgendamento && (
        <AgendamentoModal 
          isOpen={showAgendamento} 
          onClose={() => setShowAgendamento(false)} 
          onAgendar={() => {}}
        />
      )}
      {showMeusAgendamentos && (
        <MeusAgendamentosModal 
          isOpen={showMeusAgendamentos} 
          onClose={() => setShowMeusAgendamentos(false)}
          onAlterarAgendamento={() => {
            setShowMeusAgendamentos(false);
            setShowAgendamento(true);
          }}
        />
      )}
      <DivorcioExpressModal
        isOpen={showDivorcioExpressModal}
        onClose={() => setShowDivorcioExpressModal(false)}
      />
      {showMeuDivorcioModal && (
        <MeuDivorcioModal
          isOpen={showMeuDivorcioModal}
          onClose={() => setShowMeuDivorcioModal(false)}
        />
      )}
    </section>
  );
}
