require('dotenv').config();
const tickets = require('./tickets');
const { triageTicket } = require('./src/services/gemini.service');

async function main() {
  const ticket = tickets[0];
  console.log('Ticket:', ticket.subject);
  const result = await triageTicket(ticket);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Triage failed:', err.response?.data || err.message);
  process.exit(1);
});