const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/split-view/split-view.ts",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "split-view.js"
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
