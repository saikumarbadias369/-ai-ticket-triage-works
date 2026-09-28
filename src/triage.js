const tickets = require('../tickets');
const { triageTicket } = require('./services/gemini.service');

const CALL_DELAY_MS = 13000;

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runTriage() {
  const humanQueue = [];

  for (const ticket of tickets) {
    const result = await triageTicket(ticket);

    if (result.can_auto_resolve) {
      console.log(`[AUTO-RESOLVED] ${ticket.subject}`);
      console.log(result.suggested_response);
    } else {
      humanQueue.push({ ticket, ...result });
      console.log(`[ESCALATED] ${ticket.subject} - ${result.escalation_reason}`);
    }
    console.log('---');

    await delay(CALL_DELAY_MS);
    return
  }

  console.log(`Auto-resolved: ${tickets.length - humanQueue.length}/${tickets.length}`);
  console.log(`Escalated: ${humanQueue.length}`);
  return humanQueue;
}

module.exports = { runTriage };