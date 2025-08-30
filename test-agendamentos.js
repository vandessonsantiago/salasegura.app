async function testAgendamentosEndpoint() {
  try {
    const response = await fetch('http://localhost:8001/api/v1/agendamentos', {
      headers: {
        'Authorization': 'Bearer sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Endpoint funcionando!');
      console.log('Status:', response.status);
      console.log('Dados:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Erro no endpoint:', response.status, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
  }
}

testAgendamentosEndpoint();
