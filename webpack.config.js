const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, './src/index.js'),
  resolve: {
    extensions: ['*', '.js']
  },
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'build')
  },
  devServer: {
    static: path.resolve(__dirname, './build'),
  },
};