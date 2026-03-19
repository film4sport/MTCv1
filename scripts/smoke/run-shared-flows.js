const { spawnSync } = require('child_process');

function quoteArg(arg) {
  if (/[\s"]/u.test(arg)) {
    return `"${arg.replace(/"/g, '\\"')}"`;
  }
  return arg;
}

function runCommand(command, args, env) {
  if (process.platform === 'win32') {
    const shell = process.env.ComSpec || 'cmd.exe';
    const commandLine = [command, ...args.map(quoteArg)].join(' ');
    return spawnSync(shell, ['/d', '/s', '/c', commandLine], {
      stdio: 'inherit',
      env,
      cwd: process.cwd(),
      windowsHide: true,
    });
  }

  return spawnSync(command, args, {
    stdio: 'inherit',
    env,
    cwd: process.cwd(),
  });
}

const env = {
  ...process.env,
  PLAYWRIGHT_PORT: process.env.PLAYWRIGHT_PORT || '3001',
  PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001',
  PLAYWRIGHT_REUSE_SERVER: process.env.PLAYWRIGHT_REUSE_SERVER || 'true',
};

const result = runCommand(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['playwright', 'test', '--project=desktop-only', '--grep=Core'], env);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
