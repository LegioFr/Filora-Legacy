import fs from 'node:fs';

function invalid() {
  process.stdout.write(`${JSON.stringify({ ok: false, error: 'INVALID_INPUT' })}\n`);
}

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  invalid();
  process.exit(0);
}

const { gross, tare } = input ?? {};

if (
  !Number.isFinite(gross) ||
  !Number.isFinite(tare) ||
  gross < 0 ||
  tare < 0 ||
  tare >= gross
) {
  invalid();
  process.exit(0);
}

const net = Math.round((gross - tare) * 10) / 10;
process.stdout.write(`${JSON.stringify({ ok: true, net })}\n`);
