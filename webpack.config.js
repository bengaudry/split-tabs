const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    "split-view": "./src/app/split-view/split-view.ts",
    background: "./src/app/background/background.ts"
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
