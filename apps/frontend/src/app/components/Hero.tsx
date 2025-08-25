import { CheckSquare, Users, Calendar, SignIn } from 'phosphor-react';
import { useRouter } from 'next/navigation';
import CardHero from './CardHero';

export default function Hero() {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

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
              badge={{
                text: "GRATUITO",
                variant: "free"
              }}
              button={{
                text: "ACESSAR AGORA",
                variant: "secondary",
                onClick: () => console.log('Checklist clicked')
              }}
            />

            {/* Card 2 - Divórcio Express */}
            <CardHero
              icon={<Users size={22} />}
              title="Divórcio Express - Solução para casais sem filhos"
              price={{
                original: "R$ 1.450,00",
                current: "R$ 759,00"
              }}
              button={{
                text: "RESOLVER AGORA",
                variant: "primary",
                onClick: () => console.log('Divórcio clicked')
              }}
              highlight={true}
            />

            {/* Card 3 - Consulta */}
            <CardHero
              icon={<Calendar size={22} />}
              title="Agendar Consulta de Alinhamento Inicial"
              price={{
                original: "R$ 759,00",
                current: "R$ 99,00"
              }}
              button={{
                text: "AGENDAR CONSULTA",
                variant: "primary",
                onClick: () => console.log('Consulta clicked')
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
