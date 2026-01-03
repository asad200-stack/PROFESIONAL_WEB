/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  });
  return res.status === 0;
}

// Always generate client
if (!run('npx', ['prisma', 'generate'])) {
  console.warn('Warning: prisma generate failed (continuing)');
}

// Prefer migrate deploy (for Railway with migrations), fallback to db push (initial sync)
if (!run('npx', ['prisma', 'migrate', 'deploy'])) {
  console.warn('migrate deploy failed, trying db push...');
  if (!run('npx', ['prisma', 'db', 'push'])) {
    console.error('Prisma schema sync failed.');
    process.exit(1);
  }
}

console.log('Prisma schema ready.');


