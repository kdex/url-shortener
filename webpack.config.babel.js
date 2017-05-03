import path from "path";
import webpack from "webpack";
// import BabiliPlugin from "babili-webpack-plugin";
const SOURCE = path.join(__dirname, "src", "client");
const DESTINATION = path.join(__dirname, "assets/js");
const ENV = process.env.NODE_ENV;
const isDebug = ENV === "development";
const configuration = {
	entry: {
		client: "./src/client/js/client"
	},
	output: {
		path: DESTINATION,
		publicPath: "/test/",
		filename: "script.js"
	},
	module: {
		rules: [{
			test: /\.js$/,
			exclude: /(node_modules)/,
			use: "babel-loader",
		}, {
			test: /\.json$/,
			use: "json-loader"
		}]
	},
	externals: {
		ws: "WebSocket"
	},
	// devtool: isDebug ? "inline-sourcemap" : false,
	devtool: "inline-source-map",
	plugins: isDebug ? [] : [
		// new webpack.optimize.DedupePlugin(),
		// new webpack.optimize.OccurrenceOrderPlugin(),
		// new BabiliPlugin()
	],
	devServer: {
		/* The `https` section is needed to work around https://github.com/chimurai/http-proxy-middleware/issues/143 */
		https: {
			spdy: {
				protocols: ["http/1.1"],
			}
		},
		proxy: {
			"/socket/api": {
				target: "wss://punchy-old/socket/api",
				ws: true,
				/* nginx redirects HTTP to HTTPS; in development, we don't care about security, though */
				secure: false
			}
		}
	}

};
export default configuration;