const path = require('path')
const printf = require('printf')
const slugify = require('slugify')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const dist = path.resolve(__dirname, 'dist')
const indexHtml = path.resolve(__dirname, './assets/html/index.html')

function sanitizeFilename (file) {
  const ext = path.extname(file)
  const name = path.basename(file, ext)
  const slug = slugify(name, { lower: true })

  return slug
}

function rename (format) {
  return (file) => printf(format, sanitizeFilename(file))
}


module.exports = {
  entry: './src/entry/index.ts',
  output: {
    filename: '[name].[contenthash].js',
    publicPath: '',
    path: dist,
    clean: true
  },
  devtool: 'inline-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
    },
    compress: true,
    port: 8080,
    open: false,
    hot: true
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }, {
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader'
      ]
    }, {
      test: /\.(png|jpg|xml)$/,
      type: 'asset/resource'
    }, {
      test: /\.(mp3|ogg)$/,
      type: 'asset/resource'
    }]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    }),
    new HtmlWebpackPlugin({
      title: 'Phaser Game',
      template: indexHtml
    })
  ]
}
