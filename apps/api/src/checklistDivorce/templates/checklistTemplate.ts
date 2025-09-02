// MÓDULO CHECKLIST DIVORCE - TEMPLATE DE ITENS

import { ChecklistTemplateItem } from '../types/checklistDivorce.types';

export const CURRENT_TEMPLATE_VERSION = 2;

// Template ampliado v2 (50 itens) - Checklist completo para divórcio
export const CHECKLIST_TEMPLATE: ChecklistTemplateItem[] = [
  // 1. ELEGIBILIDADE DO PROCEDIMENTO
  { item_id: '1.1', category: 'elegibilidade_procedimento', text: 'Divórcio é consensual e integral (partilha, alimentos e nome definidos).', title: 'Divórcio é consensual e integral (partilha, alimentos e nome definidos).' },
  { item_id: '1.2', category: 'elegibilidade_procedimento', text: 'Não há filhos menores ou incapazes e não há gestação em curso.', title: 'Não há filhos menores ou incapazes e não há gestação em curso.' },
  { item_id: '1.3', category: 'elegibilidade_procedimento', text: 'Ambas as partes são plenamente capazes e manifestam vontade livre.', title: 'Ambas as partes são plenamente capazes e manifestam vontade livre.' },
  { item_id: '1.4', category: 'elegibilidade_procedimento', text: 'Presença de advogado(a) (um para ambos ou um para cada) com OAB ativa.', title: 'Presença de advogado(a) (um para ambos ou um para cada) com OAB ativa.' },
  { item_id: '1.5', category: 'elegibilidade_procedimento', text: 'Definida a via: extrajudicial (cartório) ou judicial (se houver motivo).', title: 'Definida a via: extrajudicial (cartório) ou judicial (se houver motivo).' },
  { item_id: '1.6', category: 'elegibilidade_procedimento', text: 'Data de corte patrimonial (separação de fato) definida.', title: 'Data de corte patrimonial (separação de fato) definida.' },
  { item_id: '1.7', category: 'elegibilidade_procedimento', text: 'Regime de bens identificado e natureza de cada bem analisada.', title: 'Regime de bens identificado e natureza de cada bem analisada.' },
  { item_id: '1.8', category: 'elegibilidade_procedimento', text: 'Impedimentos contratuais/legais verificados (alienações, financiamentos, restrições).', title: 'Impedimentos contratuais/legais verificados (alienações, financiamentos, restrições).' },

  // 2. DOCUMENTOS PESSOAIS
  { item_id: '2.1', category: 'documentos_pessoais', text: 'Certidão de casamento atualizada (~90 dias).', title: 'Certidão de casamento atualizada (~90 dias).' },
  { item_id: '2.2', category: 'documentos_pessoais', text: 'Pacto antenupcial registrado (se houver).', title: 'Pacto antenupcial registrado (se houver).' },
  { item_id: '2.3', category: 'documentos_pessoais', text: 'Documentos pessoais válidos (RG, CPF, etc.).', title: 'Documentos pessoais válidos (RG, CPF, etc.).' },
  { item_id: '2.4', category: 'documentos_pessoais', text: 'Comprovante de endereço de cada parte.', title: 'Comprovante de endereço de cada parte.' },
  { item_id: '2.5', category: 'documentos_pessoais', text: 'Procuração pública específica (se representação).', title: 'Procuração pública específica (se representação).' },
  { item_id: '2.6', category: 'documentos_pessoais', text: 'Declaração de inexistência de gravidez (se exigido).', title: 'Declaração de inexistência de gravidez (se exigido).' },
  { item_id: '2.7', category: 'documentos_pessoais', text: 'Contatos (e-mail/telefone) confirmados.', title: 'Contatos (e-mail/telefone) confirmados.' },

  // 3. FILHOS MAIORES
  { item_id: '3.1', category: 'filhos_maiores', text: 'Identificação de filhos maiores (se houver).', title: 'Identificação de filhos maiores (se houver).' },
  { item_id: '3.2', category: 'filhos_maiores', text: 'Benefícios voluntários (plano de saúde, apoio financeiro) definidos.', title: 'Benefícios voluntários (plano de saúde, apoio financeiro) definidos.' },
  { item_id: '3.3', category: 'filhos_maiores', text: 'Ajustes no IRPF (dependência/deduções) considerados.', title: 'Ajustes no IRPF (dependência/deduções) considerados.' },
  { item_id: '3.4', category: 'filhos_maiores', text: 'Acordos interfamiliares facultativos registrados.', title: 'Acordos interfamiliares facultativos registrados.' },

  // 4. PATRIMÔNIO E FINANÇAS
  { item_id: '4.1', category: 'patrimonio_financas', text: 'Lista detalhada de bens (imóveis, veículos, quotas, cripto etc.).', title: 'Lista detalhada de bens (imóveis, veículos, quotas, cripto etc.).' },
  { item_id: '4.2', category: 'patrimonio_financas', text: 'Imóveis: matrículas, ônus, IPTU, taxas, condomínio.', title: 'Imóveis: matrículas, ônus, IPTU, taxas, condomínio.' },
  { item_id: '4.3', category: 'patrimonio_financas', text: 'Veículos: CRLV, Renavam, IPVA, multas, seguro.', title: 'Veículos: CRLV, Renavam, IPVA, multas, seguro.' },
  { item_id: '4.4', category: 'patrimonio_financas', text: 'Ativos financeiros: extratos (contas, investimentos, previdência).', title: 'Ativos financeiros: extratos (contas, investimentos, previdência).' },
  { item_id: '4.5', category: 'patrimonio_financas', text: 'Créditos a receber (FGTS, PIS, PLR, ações, restituição, haveres).', title: 'Créditos a receber (FGTS, PIS, PLR, ações, restituição, haveres).' },
  { item_id: '4.6', category: 'patrimonio_financas', text: 'Bens/direitos digitais (domínios, licenças, plataformas, carteiras).', title: 'Bens/direitos digitais (domínios, licenças, plataformas, carteiras).' },
  { item_id: '4.7', category: 'patrimonio_financas', text: 'Dívidas/obrigações (cartões, empréstimos, financiamentos, consórcios).', title: 'Dívidas/obrigações (cartões, empréstimos, financiamentos, consórcios).' },
  { item_id: '4.8', category: 'patrimonio_financas', text: 'Bens particulares discriminados (anteriores, heranças, doações).', title: 'Bens particulares discriminados (anteriores, heranças, doações).' },
  { item_id: '4.9', category: 'patrimonio_financas', text: 'Prazos/formas de transferência de bens/documentos definidos.', title: 'Prazos/formas de transferência de bens/documentos definidos.' },
  { item_id: '4.10', category: 'patrimonio_financas', text: 'Cláusula de sobrepartilha prevista.', title: 'Cláusula de sobrepartilha prevista.' },

  // 5. TRIBUTAÇÃO E CUSTOS
  { item_id: '5.1', category: 'tributacao_custos', text: 'Incidência de ITBI/ITCMD avaliada (partilha desigual/torna).', title: 'Incidência de ITBI/ITCMD avaliada (partilha desigual/torna).' },
  { item_id: '5.2', category: 'tributacao_custos', text: 'Ganho de capital (torna/permuta) avaliado com contador(a).', title: 'Ganho de capital (torna/permuta) avaliado com contador(a).' },
  { item_id: '5.3', category: 'tributacao_custos', text: 'Emolumentos e taxas de registro mapeados.', title: 'Emolumentos e taxas de registro mapeados.' },
  { item_id: '5.4', category: 'tributacao_custos', text: 'Honorários advocatícios/mediação definidos.', title: 'Honorários advocatícios/mediação definidos.' },
  { item_id: '5.5', category: 'tributacao_custos', text: 'Impactos no IRPF (bens, rendimentos, pensão) considerados.', title: 'Impactos no IRPF (bens, rendimentos, pensão) considerados.' },

  // 6. ALIMENTOS E OBRIGAÇÕES
  { item_id: '6.1', category: 'alimentos_obrigacoes', text: 'Pensão: existência, valor ou renúncia.', title: 'Pensão: existência, valor ou renúncia.' },
  { item_id: '6.2', category: 'alimentos_obrigacoes', text: 'Alimentos compensatórios temporários (se aplicável).', title: 'Alimentos compensatórios temporários (se aplicável).' },
  { item_id: '6.3', category: 'alimentos_obrigacoes', text: 'Regras de pagamento: índice, datas, conta/PIX, recibo.', title: 'Regras de pagamento: índice, datas, conta/PIX, recibo.' },
  { item_id: '6.4', category: 'alimentos_obrigacoes', text: 'Cláusula penal por atraso e meios de execução.', title: 'Cláusula penal por atraso e meios de execução.' },
  { item_id: '6.5', category: 'alimentos_obrigacoes', text: 'Uso de imóvel comum até transferência ajustado.', title: 'Uso de imóvel comum até transferência ajustado.' },

  // 7. NOME E COMUNICAÇÕES
  { item_id: '7.1', category: 'nome_comunicacoes', text: 'Decisão sobre manutenção ou retomada do nome.', title: 'Decisão sobre manutenção ou retomada do nome.' },
  { item_id: '7.2', category: 'nome_comunicacoes', text: 'Averbação do divórcio e atualização de documentos.', title: 'Averbação do divórcio e atualização de documentos.' },
  { item_id: '7.3', category: 'nome_comunicacoes', text: 'Atualização cadastral em órgãos e instituições.', title: 'Atualização cadastral em órgãos e instituições.' },
  { item_id: '7.4', category: 'nome_comunicacoes', text: 'Atualização de beneficiários (seguros, previdência, etc.).', title: 'Atualização de beneficiários (seguros, previdência, etc.).' },

  // 8. EXECUÇÃO DA PARTILHA
  { item_id: '8.1', category: 'execucao_partilha', text: 'Anuência do agente financeiro para imóveis financiados (se preciso).', title: 'Anuência do agente financeiro para imóveis financiados (se preciso).' },
  { item_id: '8.2', category: 'execucao_partilha', text: 'Registro da partilha nos cartórios competentes.', title: 'Registro da partilha nos cartórios competentes.' },
  { item_id: '8.3', category: 'execucao_partilha', text: 'Transferência de titularidade (utilidades, IPTU, condomínio) e chaves.', title: 'Transferência de titularidade (utilidades, IPTU, condomínio) e chaves.' },
  { item_id: '8.4', category: 'execucao_partilha', text: 'Veículos: transferência, comunicação e seguro.', title: 'Veículos: transferência, comunicação e seguro.' },

  // 9. MINUTA E CARTÓRIO
  { item_id: '9.1', category: 'minuta_cartorio', text: 'Cartório de Notas escolhido e exigências verificadas.', title: 'Cartório de Notas escolhido e exigências verificadas.' },
  { item_id: '9.2', category: 'minuta_cartorio', text: 'Assinatura presencial ou e-Notariado definida.', title: 'Assinatura presencial ou e-Notariado definida.' },
  { item_id: '9.3', category: 'minuta_cartorio', text: 'Procuração com poderes expressos (se representação).', title: 'Procuração com poderes expressos (se representação).' },

  // 10. CLÁUSULAS FINAIS
  { item_id: '10.1', category: 'clausulas_finais', text: 'Declaração de inexistência de filhos menores/incapazes e gestação.', title: 'Declaração de inexistência de filhos menores/incapazes e gestação.' },
  { item_id: '10.2', category: 'clausulas_finais', text: 'Quitação recíproca (bens/dívidas), ressalvada sobrepartilha.', title: 'Quitação recíproca (bens/dívidas), ressalvada sobrepartilha.' },
  { item_id: '10.3', category: 'clausulas_finais', text: 'Eleição de foro para execução.', title: 'Eleição de foro para execução.' },
  { item_id: '10.4', category: 'clausulas_finais', text: 'Cláusula de confidencialidade (se desejado).', title: 'Cláusula de confidencialidade (se desejado).' },
  { item_id: '10.5', category: 'clausulas_finais', text: 'Mediação prévia para conflitos futuros (facultativo).', title: 'Mediação prévia para conflitos futuros (facultativo).' },
  { item_id: '10.6', category: 'clausulas_finais', text: 'Assistência de advogado(a) e ciência dos efeitos registrada.', title: 'Assistência de advogado(a) e ciência dos efeitos registrada.' },
  { item_id: '10.7', category: 'clausulas_finais', text: 'Vigência imediata após lavratura.', title: 'Vigência imediata após lavratura.' },
  { item_id: '10.8', category: 'clausulas_finais', text: 'Guarda segura de cópias e comprovantes.', title: 'Guarda segura de cópias e comprovantes.' },
  { item_id: '10.9', category: 'clausulas_finais', text: 'Encerramento de contas conjuntas, cartões e acessos.', title: 'Encerramento de contas conjuntas, cartões e acessos.' },
  { item_id: '10.10', category: 'clausulas_finais', text: 'Itens facultativos (animais de estimação, bens móveis).', title: 'Itens facultativos (animais de estimação, bens móveis).' },
];

// Categorias disponíveis no checklist
export const CHECKLIST_CATEGORIES = [
  'elegibilidade_procedimento',
  'documentos_pessoais',
  'filhos_maiores',
  'patrimonio_financas',
  'tributacao_custos',
  'alimentos_obrigacoes',
  'nome_comunicacoes',
  'execucao_partilha',
  'minuta_cartorio',
  'clausulas_finais'
] as const;

export type ChecklistCategory = typeof CHECKLIST_CATEGORIES[number];
