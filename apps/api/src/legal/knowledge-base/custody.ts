export const CUSTODY_KNOWLEDGE = {
  types: {
    unilateral: {
      title: "Guarda Unilateral",
      description: "A criança fica sob responsabilidade de apenas um dos genitores",
      legislation: "Art. 1.583 do Código Civil",
      criteria: [
        "Melhor interesse da criança",
        "Condições de moradia",
        "Disponibilidade de tempo",
        "Relação afetiva com a criança",
        "Situação econômica"
      ]
    },

    compartilhada: {
      title: "Guarda Compartilhada",
      description: "Ambos os genitores compartilham igualmente a responsabilidade",
      legislation: "Lei 11.698/08 e Art. 1.584 do Código Civil",
      requirements: [
        "Acordo entre os pais",
        "Aprovação judicial",
        "Residência próxima (preferencialmente)",
        "Capacidade de diálogo e cooperação"
      ],
      advantages: [
        "Manutenção do vínculo com ambos os pais",
        "Compartilhamento de responsabilidades",
        "Redução de conflitos",
        "Melhor desenvolvimento emocional da criança"
      ]
    },

    alternada: {
      title: "Guarda Alternada",
      description: "A criança alterna períodos com cada genitor",
      legislation: "Art. 1.584, § 2º do Código Civil",
      conditions: [
        "Acordo entre os pais",
        "Condições similares de moradia",
        "Escola próxima a ambas as residências",
        "Relação cooperativo entre os pais"
      ]
    }
  },

  alimentos: {
    title: "Pensão Alimentícia",
    legislation: "Lei 5.478/68 (Lei de Alimentos)",
    types: {
      provisoria: "Concedida durante o processo de divórcio",
      definitiva: "Estabelecida após decisão judicial",
      revisao: "Alteração do valor baseado em mudança de circunstâncias"
    },

    calculation: {
      criteria: [
        "Necessidades do alimentando",
        "Possibilidades do alimentante",
        "Condições sociais de ambos",
        "Proporcionalidade entre as necessidades e possibilidades"
      ],

      percentage: {
        one_child: "20-25% da renda líquida",
        two_children: "25-30% da renda líquida",
        three_or_more: "30-35% da renda líquida"
      }
    }
  }
};
