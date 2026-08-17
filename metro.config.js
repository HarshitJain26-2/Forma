const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'fbjs/lib/warning': path.resolve(__dirname, 'node_modules/fbjs/lib/warning.js'),
  'fbjs/lib/invariant': path.resolve(__dirname, 'node_modules/fbjs/lib/invariant.js'),
  'fbjs/lib/emptyFunction': path.resolve(__dirname, 'node_modules/fbjs/lib/emptyFunction.js'),
  'fbjs/lib/ExecutionEnvironment': path.resolve(__dirname, 'node_modules/fbjs/lib/ExecutionEnvironment.js'),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('fbjs/lib/')) {
    const sub = moduleName.replace('fbjs/lib/', '');
    const target = path.resolve(__dirname, 'node_modules/fbjs/lib', `${sub}.js`);
    return {
      filePath: target,
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
