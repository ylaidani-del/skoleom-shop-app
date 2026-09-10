// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

// Some deps (e.g. zustand) ship an ESM build behind the "exports" field that
// contains bare `import.meta` references. Metro's web bundle isn't loaded as
// a real ES module, so evaluating that build throws `Cannot use 'import.meta'
// outside a module`. Disabling package-exports resolution makes Metro fall
// back to the "main" (CJS) build everywhere, which doesn't have this issue.
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './global.css' });
