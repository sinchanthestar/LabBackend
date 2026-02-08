const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const sourceDir = path.join(projectRoot, 'node_modules', '.prisma', 'client');
  const destDir = path.join(
    projectRoot,
    'node_modules',
    '@prisma',
    'client',
    '.prisma',
    'client',
  );

  if (!fs.existsSync(sourceDir)) {
    console.error(
      `[prisma-client-link] Source not found: ${sourceDir}. Run \"prisma generate\" first.`,
    );
    process.exit(1);
  }

  ensureDir(destDir);

  fs.cpSync(sourceDir, destDir, {
    recursive: true,
    force: true,
  });

  console.log(`[prisma-client-link] Linked generated client to ${destDir}`);
}

main();
