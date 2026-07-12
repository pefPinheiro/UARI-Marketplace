const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch only project root and root node_modules (prevents watching other workspaces' dynamic build folders)
config.watchFolders = [
  projectRoot,
  path.resolve(workspaceRoot, 'node_modules')
];

// 2. Force Metro to resolve modules from the project's node_modules first, then workspace node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Exclude Next.js .next folders and other build outputs from Metro file watcher
const exclusionList = require('metro-config/private/defaults/exclusionList').default;
config.resolver.blacklistRE = exclusionList([
  /.*\/apps\/admin-web\/\.next\/.*/,
  /.*\/apps\/lojista-web\/\.next\/.*/,
  /.*\.next\/.*/
]);

module.exports = config;
