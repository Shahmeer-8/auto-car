/**
 * Foolproof local review launcher: ensures the portable JDK is on PATH (so the
 * Firebase emulators can start regardless of the terminal's environment), then
 * boots the emulator suite (importing seeded data) and serves the Angular app.
 *
 *   npm run review
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function findJavaHome() {
  // 1) an already-valid JAVA_HOME
  const envHome = process.env.JAVA_HOME;
  if (envHome && existsSync(join(envHome, 'bin', 'java.exe'))) return envHome;

  // 2) the portable JDK we installed under <repo-parent>/tools/jdk21
  const candidates = ['D:\\Auto-car\\tools\\jdk21', join(process.cwd(), '..', 'tools', 'jdk21')];
  for (const root of candidates) {
    if (!existsSync(root)) continue;
    const dir = readdirSync(root).find((d) => d.toLowerCase().startsWith('jdk'));
    if (dir && existsSync(join(root, dir, 'bin', 'java.exe'))) return join(root, dir);
  }
  return null;
}

const javaHome = findJavaHome();
if (javaHome) {
  process.env.JAVA_HOME = javaHome;
  process.env.PATH = join(javaHome, 'bin') + (process.platform === 'win32' ? ';' : ':') + process.env.PATH;
  console.log('[review] Using JAVA_HOME =', javaHome);
} else {
  console.warn('[review] WARNING: JDK not found — the Firestore emulator will fail to start.');
}

const cmd =
  'firebase emulators:exec --import=./.emulator-data --export-on-exit=./.emulator-data "npm start"';

console.log('[review] Starting emulator + app ...\n');
const res = spawnSync(cmd, { stdio: 'inherit', shell: true });
process.exit(res.status ?? 1);
