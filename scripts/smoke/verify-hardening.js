const { spawnSync } = require('child_process');

function quoteArg(arg) {
  if (/[\s"]/u.test(arg)) {
    return `"${arg.replace(/"/g, '\\"')}"`;
  }
  return arg;
}

function runCommand(command, args) {
  if (process.platform === 'win32') {
    const shell = process.env.ComSpec || 'cmd.exe';
    const commandLine = [command, ...args].map(quoteArg).join(' ');
    return spawnSync(shell, ['/d', '/s', '/c', commandLine], {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
      windowsHide: true,
    });
  }

  return spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });
}

const commands = [
  ['npm', ['run', 'check']],
  ['npm', ['run', 'test:unit', '--', 'unit-tests/api-notifications.test.js', 'unit-tests/mobile-notification-regressions.test.js', 'unit-tests/mobile-messaging-regressions.test.js', 'unit-tests/mobile-booking-regressions.test.js', 'unit-tests/mobile-polish-regressions.test.js', 'unit-tests/mobile-sync-regressions.test.js', 'unit-tests/mobile-captain-regressions.test.js', 'unit-tests/mobile-admin-export-regressions.test.js', 'unit-tests/dashboard-announcement-regressions.test.js', 'unit-tests/api-conversations.test.js']],
  ['npm', ['run', 'test:shared-flows']],
];

for (const [command, args] of commands) {
  const cmd = process.platform === 'win32' ? `${command}.cmd` : command;
  const result = runCommand(cmd, args);

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
