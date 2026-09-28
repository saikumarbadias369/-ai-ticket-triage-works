require('dotenv').config();
const { runTriage } = require('./src/triage');

runTriage().catch((err) => {
  console.error('Triage run failed:', err.response?.data || err.message);
  process.exit(1);
});