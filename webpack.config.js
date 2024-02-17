const path = require("path");

//most npm plugins can now be installed without altering anything here! Only make changes if webpack throws errors. 
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
          //babel loader is needed for ES6 syntax
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        //typescript handler, needed for logto
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