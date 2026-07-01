const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;           // apps/mobile
const workspaceRoot = path.resolve(projectRoot, '../..');  // repo root

const config = getDefaultConfig(projectRoot);

// ─── 1. Watch the entire monorepo ────────────────────────────────────────────
config.watchFolders = [workspaceRoot];

// ─── 2. Tell Metro where to look for node_modules ────────────────────────────
// Order matters: local (apps/mobile) first, then root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// ─── 3. Explicit resolution for packages that MUST be singletons ─────────────
// These packages must resolve to exactly one copy — pick the root copy since
// that is where npm/yarn hoisted them.  If a package only lives at root, point
// there.  If a local copy exists (e.g. react in apps/mobile/node_modules),
// point to the local copy so it overrides the root.
function resolveFrom(base, pkg) {
  try {
    // Try to find the package's directory relative to `base`
    return path.resolve(base, 'node_modules', pkg);
  } catch {
    return null;
  }
}

const mobileModules = path.resolve(projectRoot, 'node_modules');
const rootModules   = path.resolve(workspaceRoot, 'node_modules');

// Pick local copy if it exists, otherwise fall back to root
function pickBest(pkg) {
  const localPath = path.resolve(mobileModules, pkg);
  const rootPath  = path.resolve(rootModules, pkg);
  const fs = require('fs');
  return fs.existsSync(localPath) ? localPath : rootPath;
}

config.resolver.extraNodeModules = {
  'react':                           pickBest('react'),
  'react-native':                    pickBest('react-native'),
  'react-native-safe-area-context':  pickBest('react-native-safe-area-context'),
  'react-native-screens':            pickBest('react-native-screens'),
  'react-native-svg':                pickBest('react-native-svg'),
  '@react-native-async-storage/async-storage': pickBest('@react-native-async-storage/async-storage'),
};

// ─── 4. Block list — only block a root copy when a LOCAL copy also exists ────
// This prevents duplicate-module conflicts (two React trees, two registries).
// IMPORTANT: do NOT block packages that only live at root — that breaks bundling.
const fs = require('fs');

function blockRootIfLocal(pkg) {
  const localPath = path.resolve(mobileModules, pkg);
  if (fs.existsSync(localPath)) {
    // There IS a local copy → block the root one to force using local
    const escaped = rootModules.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`${escaped}[/\\\\]${pkg.replace(/\//g, '[/\\\\]')}[/\\\\]`);
  }
  return null; // No local copy → don't block root (it's the only copy)
}

const SINGLETON_PACKAGES = [
  'react',
  'react-native',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
];

config.resolver.blockList = SINGLETON_PACKAGES
  .map(blockRootIfLocal)
  .filter(Boolean);

module.exports = config;
