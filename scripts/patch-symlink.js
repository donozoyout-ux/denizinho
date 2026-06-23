const fs = require('fs');
const path = require('path');

const origSymlink = fs.symlink;
const origSymlinkSync = fs.symlinkSync;

async function patchedSymlink(target, dest, type) {
  try {
    return await origSymlink.call(fs, target, dest, type);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EEXIST') {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      if (fs.existsSync(dest)) return;
      const resolvedTarget = path.resolve(path.dirname(dest), target);
      if (fs.existsSync(resolvedTarget)) {
        const stat = fs.statSync(resolvedTarget);
        if (stat.isDirectory()) {
          fs.cpSync(resolvedTarget, dest, { recursive: true });
        } else {
          fs.copyFileSync(resolvedTarget, dest);
        }
      }
      return;
    }
    throw err;
  }
}

function patchedSymlinkSync(target, dest, type) {
  try {
    return origSymlinkSync.call(fs, target, dest, type);
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EEXIST') {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      if (fs.existsSync(dest)) return;
      const resolvedTarget = path.resolve(path.dirname(dest), target);
      if (fs.existsSync(resolvedTarget)) {
        const stat = fs.statSync(resolvedTarget);
        if (stat.isDirectory()) {
          fs.cpSync(resolvedTarget, dest, { recursive: true });
        } else {
          fs.copyFileSync(resolvedTarget, dest);
        }
      }
      return;
    }
    throw err;
  }
}

fs.symlink = patchedSymlink;
fs.symlinkSync = patchedSymlinkSync;
if (fs.promises) fs.promises.symlink = patchedSymlink;

console.log('[patch-symlink] fs.symlink patched for Windows');
