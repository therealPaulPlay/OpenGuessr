const path = require("path");
const CopyWebpackPlugin = require('copy-webpack-plugin'); // Copy certain files over to build folder (like jsons)
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin'); // gzip
const { WebpackRemoveEmptyScripts } = require('webpack-remove-empty-scripts');

module.exports = {
  entry: {
    // Separate bundles for each of these
    analytics: "./JS/analytics.js",
    errorHandling: "./JS/errorHandling.js",
    signupScreen: "./JS/signupScreen.js",
    userAPI: "./JS/userAPI.js",
    main: ["./JS/categoryMenu.js", "./JS/timer.js", "./JS/main.js", "./JS/mainUI.js", "./JS/locationGeneration.js", "./JS/dailyChallenge.js", "./JS/hardMode.js", "./JS/multiplayer.js", "./JS/countryGuesser.js", "./JS/soundManager.js"],
  },
  output: {
    path: path.resolve(__dirname, "build/"),
    publicPath: "/",
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          // Babel loader is needed for ES6 syntax such as .include()
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        // TypeScript handler
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.json$/, // Target only JSON files for gzip compression
      threshold: 10240,
      minRatio: 0.8,
      deleteOriginalAssets: false,
    }),
    new CopyWebpackPlugin({
      patterns: [
        // Copies files/folders over to build
        { from: "./CSS", to: "./CSS" },
        { from: "./node_modules/leaflet/dist/leaflet.css", to: "./CSS" },
        { from: "./FONTS", to: "./FONTS" },
        { from: "./IMG", to: "./IMG" },
        { from: "./SOUNDS", to: "./SOUNDS" },
        { from: "./JSON", to: "./JSON" },
        // HTML files (must be at root in build folder)
        { from: "./HTML", to: "./" },
        // Additional files that have to be root
        { from: "favicon.ico", to: "./" },
        { from: "netlify.toml", to: "./" },
      ],
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [
      // TerserPlugin for JS minimization
      new TerserPlugin({
        extractComments: false, // Prevent generation of license.txt files
      }),
      // JsonMinimizerPlugin for JSON minimization
      new JsonMinimizerPlugin(),
    ],
  },
};
