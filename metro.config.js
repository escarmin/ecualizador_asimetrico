const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const isProduction = process.env.NODE_ENV === 'production';

const customConfig = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath: isProduction
      ? require.resolve('./scripts/production-transformer.js')
      : undefined,
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);
