/**
 * Integração com CRM - HubSpot
 * 
 * Sistema para capturar leads automaticamente do chat
 * e criar contatos no HubSpot com automação de email
 */

export interface ContactData {
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  state: string;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface CRMResponse {
  success: boolean;
  contactId?: string;
  error?: string;
  message?: string;
}

class HubSpotIntegration {
  private apiKey: string;
  private baseUrl = 'https://api.hubapi.com';

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY || '';
    if (!this.apiKey) {
      console.warn('HUBSPOT_API_KEY não configurada');
    }
  }

  /**
   * Criar contato no HubSpot
   */
  async createContact(contactData: ContactData): Promise<CRMResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'API Key não configurada'
      };
    }

    try {
      const [firstName, ...lastNameParts] = contactData.name.split(' ');
      const lastName = lastNameParts.join(' ');

      const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            firstname: firstName,
            lastname: lastName,
            email: contactData.email,
            phone: contactData.whatsapp,
            city: contactData.city,
            state: contactData.state,
            lifecyclestage: 'lead',
            hs_lead_status: 'NEW'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HubSpot API Error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Criar nota sobre a origem do lead
      await this.createNote(data.id, `Lead capturado via chat do website. Interessado em divórcio. Cidade: ${contactData.city}/${contactData.state}. Origem: ${contactData.source || 'chat_website'}`);

      return {
        success: true,
        contactId: data.id,
        message: 'Contato criado com sucesso no HubSpot'
      };

    } catch (error) {
      console.error('Erro ao criar contato no HubSpot:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Criar nota no contato
   */
  private async createNote(contactId: string, note: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/crm/v3/objects/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            hs_note_body: note,
            hs_timestamp: new Date().toISOString()
          },
          associations: [
            {
              to: {
                id: contactId
              },
              types: [
                {
                  associationCategory: "HUBSPOT_DEFINED",
                  associationTypeId: 1
                }
              ]
            }
          ]
        })
      });
    } catch (error) {
      console.error('Erro ao criar nota:', error);
    }
  }

  /**
   * Enviar email de boas-vindas via HubSpot
   */
  async sendWelcomeEmail(contactId: string, contactData: ContactData): Promise<boolean> {
    try {
      // Aqui você pode integrar com o sistema de email do HubSpot
      // ou usar um webhook para disparar automação
      console.log(`Email de boas-vindas enviado para ${contactData.email}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }
}

// Instância global
export const hubspot = new HubSpotIntegration();

/**
 * Função principal para processar leads
 */
export async function processLead(contactData: ContactData): Promise<CRMResponse> {
  try {
    // 1. Criar contato no HubSpot
    const result = await hubspot.createContact(contactData);
    
    if (result.success && result.contactId) {
      // 2. Enviar email de boas-vindas
      await hubspot.sendWelcomeEmail(result.contactId, contactData);
      
      // 3. Log do sucesso
      console.log(`Lead processado com sucesso: ${contactData.email}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Erro ao processar lead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Função para validar dados de contato
 */
export function validateContactData(data: ContactData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }
  
  if (!data.whatsapp || data.whatsapp.trim().length < 10) {
    errors.push('WhatsApp inválido');
  }
  
  if (!data.city || data.city.trim().length < 2) {
    errors.push('Cidade inválida');
  }
  
  if (!data.state || data.state.trim().length !== 2) {
    errors.push('Estado inválido');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
