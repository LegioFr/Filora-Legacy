import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const solution = resolve('experiments/agent-loop/solution.mjs');

const cases = [
  { name: 'basic subtraction', input: { gross: 1000, tare: 200 }, expected: { ok: true, net: 800 } },
  { name: 'two-decimal result', input: { gross: 750.55, tare: 125.2 }, expected: { ok: true, net: 625.35 } },
  { name: 'zero equals zero', input: { gross: 0, tare: 0 }, expected: { ok: true, net: 0 } },
  { name: 'equal positive values', input: { gross: 25.25, tare: 25.25 }, expected: { ok: true, net: 0 } },
  { name: 'negative gross rejected', input: { gross: -1, tare: 0 }, expected: { ok: false, error: 'INVALID_INPUT' } },
  { name: 'negative tare rejected', input: { gross: 10, tare: -1 }, expected: { ok: false, error: 'INVALID_INPUT' } },
  { name: 'tare above gross rejected', input: { gross: 10, tare: 11 }, expected: { ok: false, error: 'INVALID_INPUT' } },
  { name: 'non numeric rejected', input: { gross: '10', tare: 1 }, expected: { ok: false, error: 'INVALID_INPUT' } },
];

function runCandidate(input) {
  const result = spawnSync(
    'docker',
    [
      'run', '--rm',
      '--network', 'none',
      '--read-only',
      '--cap-drop=ALL',
      '--security-opt', 'no-new-privileges',
      '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m',
      '-i',
      '-v', `${solution}:/app/solution.mjs:ro`,
      'node:22-alpine',
      'node', '/app/solution.mjs',
    ],
    {
      input: `${JSON.stringify(input)}\n`,
      encoding: 'utf8',
      timeout: 15000,
      env: { PATH: process.env.PATH },
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`candidate exited ${result.status}: ${result.stderr.trim()}`);
  }

  const stdout = result.stdout.trim();
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  if (lines.length !== 1) {
    throw new Error(`expected exactly one stdout line, got ${lines.length}: ${stdout}`);
  }
  return JSON.parse(lines[0]);
}

let failures = 0;
for (const testCase of cases) {
  try {
    const actual = runCandidate(testCase.input);
    if (JSON.stringify(actual) !== JSON.stringify(testCase.expected)) {
      failures += 1;
      console.error(`FAIL ${testCase.name}`);
      console.error(`  expected: ${JSON.stringify(testCase.expected)}`);
      console.error(`  actual:   ${JSON.stringify(actual)}`);
    } else {
      console.log(`PASS ${testCase.name}`);
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${testCase.name}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures > 0) {
  console.error(`${failures} sandbox test(s) failed.`);
  process.exit(1);
}

console.log(`All ${cases.length} sandbox tests passed.`);
