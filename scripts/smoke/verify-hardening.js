const { spawnSync } = require('child_process');

const commands = [
  ['npm', ['run', 'check']],
  ['npm', ['run', 'test:unit', '--', 'unit-tests/api-notifications.test.js', 'unit-tests/mobile-messaging-regressions.test.js', 'unit-tests/api-conversations.test.js']],
  ['npm', ['run', 'test:shared-flows']],
];

for (const [command, args] of commands) {
  const cmd = process.platform === 'win32' ? `${command}.cmd` : command;
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
    shell: process.platform === 'win32',
  });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
