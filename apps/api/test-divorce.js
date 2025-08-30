import fetch from 'node-fetch';

async function testDivorceEndpoint() {
  try {
    const response = await fetch('http://localhost:8001/api/v1/divorcio/iniciar-com-pagamento', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sbp_19d860ec11ce9e6b32732fa87a8c0b8d94f29a5c'
      },
      body: JSON.stringify({
        type: 'express',
        paymentId: 'pay_oovrjs5sy2nv79l3',
        qrCodePix: 'test-qr-code',
        copyPastePix: 'test-copy-paste',
        pixExpiresAt: '2025-08-30T00:00:00Z'
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('Response body:', text);

    try {
      const data = JSON.parse(text);
      console.log('Parsed response:', data);
    } catch (e) {
      console.log('Response is not JSON');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDivorceEndpoint();