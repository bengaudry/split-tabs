const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    "split-view": "./src/app/split-view/split-view.ts",
    background: "./src/app/background/background.ts"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      background: path.resolve(__dirname, "./src/app/background/"),
      popup: path.resolve(__dirname, "./src/app/popup/"),
      settings: path.resolve(__dirname, "./src/app/settings/"),
      "split-view": path.resolve(__dirname, "./src/app/split-view/"),
      shared: path.resolve(__dirname, "./src/shared/")
    }
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
    minimize: false,
    usedExports: true
  }
};
