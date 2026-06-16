const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all directories in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Resolve node_modules from both local app and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Disable hierarchical lookup to force symlink resolution
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
