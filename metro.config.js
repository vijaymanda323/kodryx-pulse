const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalGetPolyfills = config.serializer.getPolyfills;
config.serializer.getPolyfills = (options) => {
  return [
    ...originalGetPolyfills(options),
    path.join(__dirname, 'polyfill.js'),
  ];
};

module.exports = config;
