import { supabaseAdmin } from '../lib/supabase';
import type {
  Conversion,
  ConversionInsert
} from '../types/database';

export class ConversionService {
  static async create(conversionData: ConversionInsert): Promise<Conversion | null> {
    const { data, error } = await supabaseAdmin
      .from('conversions')
      .insert([conversionData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conversão:', error);
      return null;
    }

    return data;
  }

  static async findByToken(token: string): Promise<Conversion | null> {
    const { data, error } = await supabaseAdmin
      .from('conversions')
      .select('*')
      .eq('access_token', token)
      .single();

    if (error) {
      console.error('Erro ao buscar conversão por token:', error);
      return null;
    }

    return data;
  }

  static async updateStatus(id: string, status: string): Promise<Conversion | null> {
    const { data, error } = await supabaseAdmin
      .from('conversions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status da conversão:', error);
      return null;
    }

    return data;
  }
}

export default ConversionService;
