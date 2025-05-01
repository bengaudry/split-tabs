const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/split-view.js",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "split-view.js",
  },
  optimization: {
    minimize: false
 },
};
