#!/bin/bash

# Iniciar servidor em background
cd /Users/vandessonsantiago/Documents/salasegura/apps/api
node dist/index.cjs &
SERVER_PID=$!

# Aguardar servidor iniciar
sleep 3

# Testar endpoint de chat
echo "Testando endpoint de chat..."
curl -X POST "http://localhost:8001/api/v1/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Olá, preciso de ajuda com divórcio","chatHistory":[]}'

echo -e "\n\nTestando endpoint de status..."
curl -X GET "http://localhost:8001/api/v1/chat"

# Matar servidor
kill $SERVER_PID
