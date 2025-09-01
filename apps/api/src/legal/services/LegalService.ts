import { DIVORCE_KNOWLEDGE } from '../knowledge-base/divorce';
import { CUSTODY_KNOWLEDGE } from '../knowledge-base/custody';
import { PROPERTY_KNOWLEDGE } from '../knowledge-base/property';
import { LegalInfo } from '../../ai/types/ai.types';
import { CacheService } from '../../ai/services/CacheService';

export class LegalService {
  static async getLegalInfo(topic: string, subtopic?: string): Promise<LegalInfo | any> {
    // Verificar cache primeiro
    const cachedInfo = await CacheService.getCachedLegalInfo(topic, subtopic);
    if (cachedInfo) {
      console.log('✅ [LEGAL] Informação obtida do cache:', topic, subtopic);
      return cachedInfo;
    }

    let info: LegalInfo | any = null;

    switch (topic.toLowerCase()) {
      case 'divorcio':
      case 'divórcio':
        if (subtopic && (subtopic === 'consensual' || subtopic === 'litigioso')) {
          info = DIVORCE_KNOWLEDGE[subtopic as keyof typeof DIVORCE_KNOWLEDGE];
        } else {
          info = DIVORCE_KNOWLEDGE;
        }
        break;

      case 'guarda':
      case 'custody':
        if (subtopic && (subtopic === 'unilateral' || subtopic === 'compartilhada' || subtopic === 'alternada')) {
          info = CUSTODY_KNOWLEDGE.types[subtopic as keyof typeof CUSTODY_KNOWLEDGE.types];
        } else {
          info = CUSTODY_KNOWLEDGE;
        }
        break;

      case 'alimentos':
      case 'pensão':
        info = CUSTODY_KNOWLEDGE.alimentos;
        break;

      case 'patrimonio':
      case 'patrimônio':
      case 'property':
        if (subtopic && (subtopic === 'participacao_final' || subtopic === 'comunhao_parcial' ||
            subtopic === 'comunhao_universal' || subtopic === 'separacao_total')) {
          info = PROPERTY_KNOWLEDGE.regimes[subtopic as keyof typeof PROPERTY_KNOWLEDGE.regimes];
        } else {
          info = PROPERTY_KNOWLEDGE;
        }
        break;

      default:
        info = this.getGeneralLegalInfo();
    }

    // Salvar no cache
    if (info) {
      await CacheService.setCachedLegalInfo(topic, info, subtopic);
    }

    return info;
  }

  static searchLegalInfo(query: string): Array<{ topic: string; data: any; relevance: number }> {
    const keywords = query.toLowerCase().split(' ');

    // Buscar em todas as bases de conhecimento
    const results = [];

    // Buscar em divórcio
    if (keywords.some(k => ['divorcio', 'divórcio', 'separação'].includes(k))) {
      results.push({
        topic: 'divórcio',
        data: DIVORCE_KNOWLEDGE,
        relevance: 0.9
      });
    }

    // Buscar em guarda
    if (keywords.some(k => ['guarda', 'filhos', 'crianças'].includes(k))) {
      results.push({
        topic: 'guarda',
        data: CUSTODY_KNOWLEDGE,
        relevance: 0.8
      });
    }

    // Buscar em alimentos
    if (keywords.some(k => ['alimentos', 'pensão', 'financeiro'].includes(k))) {
      results.push({
        topic: 'alimentos',
        data: CUSTODY_KNOWLEDGE.alimentos,
        relevance: 0.8
      });
    }

    // Buscar em patrimônio
    if (keywords.some(k => ['bens', 'patrimônio', 'patrimonio', 'partilha'].includes(k))) {
      results.push({
        topic: 'patrimônio',
        data: PROPERTY_KNOWLEDGE,
        relevance: 0.7
      });
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  private static getGeneralLegalInfo(): LegalInfo {
    return {
      title: "Informações Gerais sobre Direito de Família",
      description: "O Direito de Família regula as relações familiares e conjugais",
      legislation: "Código Civil (Lei 10.406/02), Lei do Divórcio (Lei 6.515/77), Lei da União Estável (Lei 9.278/96), Lei de Alimentos (Lei 5.478/68), ECA (Lei 8.069/90)"
    };
  }

  static getAllTopics(): string[] {
    return [
      'divórcio consensual',
      'divórcio litigioso',
      'guarda unilateral',
      'guarda compartilhada',
      'guarda alternada',
      'pensão alimentícia',
      'regime de bens',
      'partilha de bens'
    ];
  }

  static async getTopicSummary(topic: string): Promise<string> {
    const info = await this.getLegalInfo(topic);
    if (!info) return '';

    let summary = `${info.title}\n`;
    if (info.description) summary += `${info.description}\n`;
    if (info.legislation) summary += `Legislação: ${info.legislation}\n`;

    return summary;
  }
}
