const { spawnSync } = require('child_process');

const env = {
  ...process.env,
  PLAYWRIGHT_PORT: process.env.PLAYWRIGHT_PORT || '3001',
  PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001',
  PLAYWRIGHT_REUSE_SERVER: process.env.PLAYWRIGHT_REUSE_SERVER || 'true',
};

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['playwright', 'test', '--project=desktop-only', '--grep', 'Core Flow'],
  {
    stdio: 'inherit',
    env,
    cwd: process.cwd(),
    shell: process.platform === 'win32',
  }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
