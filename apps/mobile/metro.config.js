// Metro config para Expo dentro de monorepo pnpm.
// Garante que node_modules sejam resolvidos a partir da raiz do workspace.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch files do workspace inteiro
config.watchFolders = [workspaceRoot];

// 2. Resolver módulos via node_modules locais e da raiz
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. pnpm linka simbolicamente — habilitar
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
