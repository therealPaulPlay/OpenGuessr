const path = require("path");

module.exports = {
  entry: {
    entry: "./JS/logto.js"
  },
  output: {
    path: path.resolve(__dirname, "build/"),
    publicPath: "/",
    filename: "bundled.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.ts$/,
        use: 'ts-loader'
      },
      {
        //in case we want to handle css via webpack in the future
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      }
    ]
  }
};