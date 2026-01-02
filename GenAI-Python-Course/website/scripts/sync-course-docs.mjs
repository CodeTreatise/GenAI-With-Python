import fs from 'node:fs/promises';
import path from 'node:path';

const siteDir = path.resolve(import.meta.dirname, '..');
const repoRootDir = path.resolve(siteDir, '..');
const docsDir = path.join(siteDir, 'docs');

async function pathExists(p) {
  try {
    await fs.lstat(p);
    return true;
  } catch {
    return false;
  }
}

async function isSymlink(p) {
  const stat = await fs.lstat(p);
  return stat.isSymbolicLink();
}

async function removeIfExists(p) {
  if (!(await pathExists(p))) return;
  // rm() will remove symlinks too (without following them)
  await fs.rm(p, {recursive: true, force: true});
}

async function copyDir(srcDir, destDir) {
  await fs.mkdir(destDir, {recursive: true});

  const entries = await fs.readdir(srcDir, {withFileTypes: true});
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    // Avoid copying any nested node_modules/git artifacts if present.
    if (entry.name === 'node_modules' || entry.name === '.git') continue;

    if (entry.isSymbolicLink()) {
      // Skip symlinks entirely to avoid recursion/host-specific paths.
      continue;
    }

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
      continue;
    }

    if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  const repoEntries = await fs.readdir(repoRootDir, {withFileTypes: true});
  const moduleDirs = repoEntries
    .filter((e) => e.isDirectory() && e.name.startsWith('Module-'))
    .map((e) => e.name)
    .sort();

  if (moduleDirs.length === 0) {
    throw new Error(`No Module-* directories found in ${repoRootDir}`);
  }

  await fs.mkdir(docsDir, {recursive: true});

  for (const moduleName of moduleDirs) {
    const srcModuleDir = path.join(repoRootDir, moduleName);
    const destModuleDir = path.join(docsDir, moduleName);

    // If there is a symlink (previous approach), remove it first.
    if (await pathExists(destModuleDir)) {
      if (await isSymlink(destModuleDir)) {
        await removeIfExists(destModuleDir);
      } else {
        // Ensure we don't accidentally keep stale copies.
        await removeIfExists(destModuleDir);
      }
    }

    await copyDir(srcModuleDir, destModuleDir);
  }
}

await main();
