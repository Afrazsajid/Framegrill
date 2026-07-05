import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const standaloneDir = path.join(root, '.next', 'standalone');

if (existsSync(standaloneDir)) {
  await mkdir(path.join(standaloneDir, '.next'), { recursive: true });

  const staticDir = path.join(root, '.next', 'static');
  const publicDir = path.join(root, 'public');
  const dbDir = path.join(root, 'db');

  if (existsSync(staticDir)) {
    await cp(staticDir, path.join(standaloneDir, '.next', 'static'), { recursive: true });
  }

  if (existsSync(publicDir)) {
    await cp(publicDir, path.join(standaloneDir, 'public'), { recursive: true });
  }

  if (existsSync(dbDir)) {
    await cp(dbDir, path.join(standaloneDir, 'db'), { recursive: true });
  }
}
