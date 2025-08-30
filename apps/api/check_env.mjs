import 'dotenv/config';

console.log('Variáveis de ambiente do Google Calendar:');
console.log('GOOGLE_CLIENT_MAIL:', process.env.GOOGLE_CLIENT_MAIL ? 'SET' : 'NOT SET');
console.log('GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID ? 'SET' : 'NOT SET');
console.log('GOOGLE_PRIVATE_KEY exists:', process.env.GOOGLE_PRIVATE_KEY ? 'YES' : 'NO');
console.log('TIMEZONE:', process.env.TIMEZONE || 'NOT SET');
console.log('APPOINTMENT_MINUTES:', process.env.APPOINTMENT_MINUTES || 'NOT SET');
