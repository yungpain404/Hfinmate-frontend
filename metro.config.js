// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable CJS file extension resolution and package exports for Firebase JS SDK
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = true;

// Resolve firebase subpath exports directly to @firebase packages
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'firebase/app': path.dirname(require.resolve('@firebase/app/package.json')),
  'firebase/auth': path.dirname(require.resolve('@firebase/auth/package.json')),
};

module.exports = config;
