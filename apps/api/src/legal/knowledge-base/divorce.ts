export const DIVORCE_KNOWLEDGE = {
  consensual: {
    title: "Divórcio Consensual",
    legislation: "Lei 6.515/77 e Lei 11.441/07",
    requirements: [
      "Acordo mútuo entre as partes",
      "Partilha de bens definida",
      "Guarda dos filhos estabelecida (se houver)",
      "Assistência de advogado ou defensor público"
    ],
    documents: [
      "Certidão de casamento original",
      "Acordo escrito e assinado por ambos",
      "Documentos pessoais (RG, CPF)",
      "Comprovante de endereço",
      "Inventário de bens (se houver patrimônio)"
    ],
    timeline: "Até 2 anos se houver filhos menores",
    cost: "Entre R$ 800 e R$ 2.500 (varia por estado)",
    procedure: [
      "Elaborar acordo com advogado",
      "Assinar acordo em cartório",
      "Aguardar homologação judicial",
      "Receber certidão de divórcio"
    ]
  },

  litigioso: {
    title: "Divórcio Litigioso",
    legislation: "Art. 1.572 do Código Civil",
    requirements: [
      "Violação dos deveres do casamento",
      "Tentativa de reconciliação frustrada",
      "Prova da violação (testemunhas, documentos)"
    ],
    grounds: [
      "Infidelidade",
      "Abandono do lar conjugal",
      "Maus tratos físicos ou psicológicos",
      "Abuso sexual",
      "Contravenção penal",
      "Abandono material"
    ],
    documents: [
      "Petição inicial com fundamentação",
      "Provas da violação",
      "Documentos pessoais",
      "Certidão de casamento",
      "Comprovante de renda"
    ],
    timeline: "Não há prazo prescricional",
    cost: "Entre R$ 2.000 e R$ 5.000 (mais custas processuais)",
    procedure: [
      "Contratar advogado",
      "Elaborar petição inicial",
      "Distribuir ação no judiciário",
      "Participar de audiência de conciliação",
      "Seguir trâmite processual normal"
    ]
  }
};
