const path = require("path");
const CopyWebpackPlugin = require('copy-webpack-plugin'); //this allows us to just copy certain files over to build folder (like jsons)
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

//most npm plugins can now be installed without altering anything here! Only make changes if webpack throws errors. 
module.exports = {
  entry: {
    //separate bundles for each of these
    analytics: "./JS/analytics.js",
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
          //babel loader is needed for ES6 syntax such as .include()
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        //typescript handler
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        // Copies files/folders over to build.
        { from: "./CSS", to: "./CSS" },
        { from: "./FONTS", to: "./FONTS" },
        { from: "./IMG", to: "./IMG" },
        { from: "./JSON", to: "./JSON" },
        //html files (must be at root in build folder)
        { from: "./HTML", to: "./" },
        //additional files that have to be root
        { from: "favicon.ico", to: "./" },
        { from: "netlify.toml", to: "./" },
        //due to dom call dependencies these JS files will not be bundled up (see readme.md)
        { from: "./JS/errorHandling.js", to: "./" },
        { from: "./JS/signupScreen.js", to: "./" },
        { from: "./JS/userAPI.js", to: "./" },

      ],
    }),
  ],
};