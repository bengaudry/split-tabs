const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    "split-view": "./src/split-view/split-view.ts",
    background: "./src/background/background.js"
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name].js"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    minimize: false
  }
};
