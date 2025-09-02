import { jest } from '@jest/globals';
import { Request, Response } from 'express';
import DivorceController from '../src/divorce/controllers/DivorceController';

// Mock do Supabase
jest.mock('../src/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn()
}));

describe('DivorcioController - Teste Básico', () => {
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  it('deve retornar erro 401 quando usuário não está autenticado', async () => {
    mockRequest = {
      user: undefined,
      body: { type: 'express' }
    };

    await DivorceController.iniciarCaso(mockRequest, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Usuário não autenticado.'
    });
  });
});
