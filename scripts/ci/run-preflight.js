const { spawnSync } = require('node:child_process');

function quoteArg(arg) {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '\\"')}"`;
}

function runStep(command, args) {
  if (process.platform === 'win32') {
    const commandLine = [command, ...args].map(quoteArg).join(' ');
    return spawnSync('cmd.exe', ['/d', '/s', '/c', commandLine], { stdio: 'inherit' });
  }

  return spawnSync(command, args, { stdio: 'inherit' });
}

const baseSteps = [
  { label: 'TypeScript', command: 'npx', args: ['tsc', '--noEmit'] },
  { label: 'Next + mobile build', command: 'npm', args: ['run', 'build'] },
  { label: 'Unit tests', command: 'npm', args: ['run', 'test:unit'] },
];

const e2eShard = process.argv
  .slice(2)
  .find((arg) => arg.startsWith('--shard='));

const steps = [...baseSteps];

if (e2eShard) {
  steps.push({
    label: `Playwright ${e2eShard.replace('--', '')}`,
    command: 'npx',
    args: ['playwright', 'test', e2eShard],
  });
}

for (const step of steps) {
  console.log(`\n[preflight] ${step.label}`);
  const result = runStep(step.command, step.args);

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\n[preflight] All checks passed');
