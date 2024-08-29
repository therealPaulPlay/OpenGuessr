const path = require("path");
const CopyWebpackPlugin = require('copy-webpack-plugin'); // Copy certain files over to build folder (like jsons)
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const JsonMinimizerPlugin = require('json-minimizer-webpack-plugin');
const CacheBusterPlugin = require('webpack-cache-buster-plugin');

module.exports = {
  entry: {
    // Separate bundles for each of these
    analytics: "./JS/analytics.js",
    main: ["./JS/categoryMenu.js", "./JS/main.js", "./JS/rewardedAds.js", "./JS/friendMenu.js"], // webpack finds other imported code automatically, these are necessary though
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
    new CacheBusterPlugin({
      htmlFilePaths: ['./HTML/index.html'], // List of HTML files to modify
      filesToCacheBust: ['main.js', 'guesser.css'], // List of files to add cache-busting query
    }),
    new CopyWebpackPlugin({
      patterns: [
        // Copies files/folders over to build
        { from: "./CSS", to: "./CSS" },
        { from: "./FONTS", to: "./FONTS" },
        { from: "./IMG", to: "./IMG" },
        { from: "./SOUNDS", to: "./SOUNDS" },
        { from: "./JSON", to: "./JSON" },
        // HTML files (must be at root in build folder)
        { from: "./HTML", to: "./" },
        // Additional files that have to be root
        { from: "favicon.ico", to: "./" },
        { from: "netlify.toml", to: "./" },
        //Other js files (not running through webpack because they shouldn't be renamed)
        { from: "./JS/errorHandling.js", to: "./" },
        { from: "./JS/signupScreen.js", to: "./" },
        { from: "./JS/userAPI.js", to: "./" },
        { from: "./JS/mapScreen.js", to: "./" },
        { from: "./JS/competitionScreen.js", to: "./" },
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
