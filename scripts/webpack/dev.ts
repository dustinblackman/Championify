import autoprefixer = require("autoprefixer");
import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as path from "path";
import webpack = require("webpack");
import WebpackDevServer = require("webpack-dev-server");

const root = path.join(__dirname, "../../");
const src = path.join(root, "app");
const port = 3000;
const ip = "0.0.0.0";

const config: webpack.Configuration = {
  devtool: "eval",
  context: src,
  entry: {
    app: [
      "react-hot-loader/patch",
      `webpack-dev-server/client?http://localhost:${port}`,
      "webpack/hot/only-dev-server",
      "./index.tsx"
    ]
  },
  output: {
    filename: "app.js",
    chunkFilename: "[name]_[chunkhash].js",
    path: path.join(root, "build"),
    publicPath: `http://localhost:${port}/`
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(false),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      __CLIENT__: true,
      __PRODUCTION__: false,
      "process.env.NODE_ENV": JSON.stringify("development")
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "template.hbs")
    })
  ],
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    modules: [src, "node_modules"]
  },
  module: {
    loaders: [
      {
        test: /\.(png|j|jpeg|jpg|gif|svg|woff|woff2)$/,
        use: {
          loader: "url-loader",
          options: {
            limit: 10000
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          {loader: "style-loader"},
          {
            loader: "css-loader",
            options: {
              root: src,
              modules: false,
              importLoaders: 1,
              localIdentName: "[name]_[local]_[hash:base64:5]"
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        use: [
          {loader: "style-loader"},
          {loader: "css-loader", options: {
            importLoaders: 1,
            modules: true,
            localIdentName: "[local]_[hash:base64:5]"
          }},
          {loader: "postcss-loader", options: {
            plugins: [autoprefixer({})] // TODO Limit to only Electron as as browser.
          }},
          {loader: "sass-loader"}
        ]
      },
      {
        test: /\.tsx?$/,
        loaders: ["react-hot-loader/webpack", "ts-loader"]
      }
    ]
  }
};

const devServerConfig = {
  publicPath: config.output && config.output.publicPath || "",
  // historyApiFallback: true,
  hot: true,
  headers: { "Access-Control-Allow-Origin": "*" }
};

new WebpackDevServer(webpack(config), devServerConfig)
  .listen(port, ip, (err?: Error) => {
    if (err) {
      return console.log(err);
    }

    console.log(`Webpack dev server listening on ${port}`);
  });
