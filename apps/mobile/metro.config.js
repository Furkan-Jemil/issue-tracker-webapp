const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all directories in the monorepo
config.watchFolders = [workspaceRoot, ...config.watchFolders];

// 2. Block root's react/react-native and duplicate native modules to prevent
//    conflicting versions (root: 19.2.x / 0.86.0 vs mobile: 19.1.0 / 0.81.5).
//    Other packages like @react-native/* resolve normally from root.
const rootNodeModules = `${workspaceRoot}/node_modules/`;
config.resolver.blockList = [
  new RegExp(`${rootNodeModules}react/`),
  new RegExp(`${rootNodeModules}react-native/`),
  new RegExp(`${rootNodeModules}react-native-safe-area-context/`),
  new RegExp(`${rootNodeModules}react-native-screens/`),
];
config.resolver.extraNodeModules = {
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-native-safe-area-context': path.resolve(
    projectRoot,
    'node_modules/react-native-safe-area-context',
  ),
  'react-native-screens': path.resolve(
    projectRoot,
    'node_modules/react-native-screens',
  ),
};

// 3. Resolve other node_modules from both local app and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
