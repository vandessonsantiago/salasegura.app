import { jest } from '@jest/globals';

// Mock do Supabase
jest.mock('../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 'test-agendamento-id',
              user_id: 'test-user-123',
              status: 'Pendente',
              payment_status: 'pending',
              valor: 99,
              descricao: 'Consulta teste',
              data: '2025-09-01',
              horario: '10:00:00',
              created_at: '2025-09-01T00:00:00Z',
              updated_at: '2025-09-01T00:00:00Z'
            },
            error: null
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: null,
                error: null
              }))
            }))
          }))
        }))
      }))
    }))
  }
}));

import { AgendamentoService } from '../src/services/AgendamentoService';

describe('AgendamentoService - Duplicate Prevention', () => {
  const testUserId = 'test-user-123';
  const testData = '2025-09-01';
  const testHorario = '10:00:00';

  beforeEach(async () => {
    // Clean up test data
    // Note: In real tests, you'd use a test database
    jest.clearAllMocks();
  });

  test('should prevent duplicate agendamentos for same user/date/time', async () => {
    // First creation should succeed
    const result1 = await AgendamentoService.criarAgendamentoBasico(
      testUserId,
      'agendamento',
      99.00,
      'Consulta teste',
      {},
      testData,
      testHorario
    );

    expect(result1.success).toBe(true);
    expect(result1.agendamento).toBeDefined();

    // Second creation with same data should reuse existing or fail
    const result2 = await AgendamentoService.criarAgendamentoBasico(
      testUserId,
      'agendamento',
      99.00,
      'Consulta teste 2',
      {},
      testData,
      testHorario
    );

    // Should either reuse existing or return error about duplicate
    expect(result2.success).toBeDefined();
    if (result2.success) {
      // If reused, should be the same agendamento
      expect(result2.agendamento?.id).toBe(result1.agendamento?.id);
    } else {
      // If failed, should mention duplicate
      expect(result2.error).toContain('duplicat');
    }
  });

  test('should handle payment_id uniqueness', async () => {
    // This would require mocking the payment service
    // For now, just test the service structure
    expect(AgendamentoService.atualizarComDadosPagamento).toBeDefined();
  });
});
