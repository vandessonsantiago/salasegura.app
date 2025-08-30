#!/bin/bash

# Iniciar servidor em background
cd /Users/vandessonsantiago/Documents/salasegura/apps/api
node dist/index.cjs &
SERVER_PID=$!

# Aguardar servidor iniciar
sleep 3

echo "=== TESTANDO CRIAÇÃO DE AGENDAMENTO COM PIX ==="

# Dados de teste para criação de agendamento
AGENDAMENTO_DATA='{
  "data": "2025-08-30",
  "horario": "14:00",
  "status": "confirmado",
  "qr_code_pix": "00020101021126860014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-42661417400016BR.COM.PAGSEGURO0136C9B3F8E3-4F1A-4B2C-8D3E-5F6G7H8I9J0K0208PAGSEGURO0304PASS0405R$ 50,00520400005303986540650.005802BR5908PAGSEGURO6008SAO PAULO62070503***6304ABCD",
  "copy_paste_pix": "00020101021126860014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-42661417400016BR.COM.PAGSEGURO0136C9B3F8E3-4F1A-4B2C-8D3E-5F6G7H8I9J0K0208PAGSEGURO0304PASS0405R$ 50,00520400005303986540650.005802BR5908PAGSEGURO6008SAO PAULO62070503***6304ABCD",
  "valor": 50.00,
  "cliente_nome": "João Silva",
  "cliente_email": "joao.silva@email.com",
  "cliente_telefone": "(11) 99999-9999",
  "descricao": "Consulta jurídica inicial"
}'

echo "Enviando dados: $AGENDAMENTO_DATA"

# Testar criação de agendamento
echo "Testando POST /api/v1/agendamentos..."
RESPONSE=$(curl -s -X POST "http://localhost:8001/api/v1/agendamentos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c" \
  -d "$AGENDAMENTO_DATA")

echo "Resposta da criação:"
echo "$RESPONSE"

# Verificar se foi criado com sucesso
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Agendamento criado com sucesso!"

  # Extrair ID do agendamento criado
  AGENDAMENTO_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  echo "ID do agendamento criado: $AGENDAMENTO_ID"

  # Testar listagem novamente para confirmar
  echo "Testando GET /api/v1/agendamentos para confirmar criação..."
  LIST_RESPONSE=$(curl -s -X GET "http://localhost:8001/api/v1/agendamentos" \
    -H "Authorization: Bearer sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c")

  echo "Resposta da listagem:"
  echo "$LIST_RESPONSE"

else
  echo "❌ Falha na criação do agendamento"
fi

# Matar servidor
kill $SERVER_PID
