#!/bin/bash

# Iniciar servidor em background
cd /Users/vandessonsantiago/Documents/salasegura/apps/api
node dist/index.cjs &
SERVER_PID=$!

# Aguardar servidor iniciar
sleep 3

# Testar endpoint
echo "Testando endpoint de agendamentos..."
curl -X GET "http://localhost:8001/api/v1/agendamentos" -H "Authorization: Bearer sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c"

# Matar servidor
kill $SERVER_PID
