export const PROPERTY_KNOWLEDGE = {
  regimes: {
    participacao_final: {
      title: "Regime de Participação Final nos Aquestos",
      legislation: "Art. 1.672-1.686 do Código Civil",
      description: "Cada cônjuge mantém seus bens próprios, mas divide os adquiridos durante o casamento",
      advantages: [
        "Proteção de bens adquiridos antes do casamento",
        "Divisão proporcional aos esforços de cada um",
        "Flexibilidade na administração dos bens"
      ],
      disadvantages: [
        "Complexidade na apuração dos valores",
        "Necessidade de avaliação de bens",
        "Possível conflito na avaliação dos esforços"
      ]
    },

    comunhao_parcial: {
      title: "Regime de Comunhão Parcial de Bens",
      legislation: "Art. 1.658-1.666 do Código Civil",
      description: "Comunhão dos bens adquiridos durante o casamento, exclusão dos bens pessoais",
      common_goods: [
        "Bens móveis e imóveis adquiridos durante o casamento",
        "Salários e proventos do trabalho",
        "Frutos civis dos bens particulares",
        "Pensões e aposentadorias"
      ],
      excluded_goods: [
        "Bens adquiridos antes do casamento",
        "Bens recebidos por herança ou doação",
        "Bens de uso pessoal",
        "Direitos autorais e propriedade intelectual"
      ]
    },

    comunhao_universal: {
      title: "Regime de Comunhão Universal de Bens",
      legislation: "Art. 1.667-1.671 do Código Civil",
      description: "Comunhão de todos os bens presentes e futuros",
      included: [
        "Todos os bens móveis e imóveis",
        "Dívidas contraídas durante o casamento",
        "Bens adquiridos antes do casamento"
      ],
      exceptions: [
        "Bens impenhoráveis por natureza",
        "Bens inalienáveis",
        "Direitos personalíssimos"
      ]
    },

    separacao_total: {
      title: "Regime de Separação Total de Bens",
      legislation: "Art. 1.687-1.688 do Código Civil",
      description: "Cada cônjuge mantém seus bens próprios",
      advantages: [
        "Simplicidade na partilha",
        "Proteção de patrimônio pessoal",
        "Independência financeira mantida"
      ],
      disadvantages: [
        "Possível desigualdade econômica",
        "Dificuldade em provar esforço conjunto",
        "Possível injustiça em casos de sacrifício profissional"
      ]
    }
  },

  partilha: {
    title: "Partilha de Bens",
    legislation: "Art. 1.775-1.795 do Código Civil",
    methods: {
      amigavel: "Por acordo entre as partes",
      judicial: "Por decisão judicial quando não há acordo"
    },

    steps: [
      "Inventário completo dos bens",
      "Avaliação dos bens por profissional",
      "Definição do regime matrimonial",
      "Cálculo da meação de cada parte",
      "Lavratura da partilha"
    ]
  }
};
