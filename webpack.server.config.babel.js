import webpack from "webpack";
import path from "path";
import fs from "fs";
const SOURCE = path.join(__dirname, "src", "server");
const DESTINATION = path.join(__dirname, "dist/server");
const ENV = process.env.NODE_ENV;
const isDebug = ENV === "development";
const nodeModules = {};
fs.readdirSync("node_modules")
	.filter(x => !x.includes(".bin"))
	.forEach(module => nodeModules[module] = `commonjs ${ module}`);
const configuration = {
	target: "node",
	node: {
		__dirname: false,
		__filename: false,
		console: false
	},
	externals: nodeModules,
	entry: {
		server: ["babel-polyfill", "./src/server/server.js"]
	},
	output: {
		path: DESTINATION,
		filename: "[name].js"
	},
	module: {
		rules: [{
			test: SOURCE,
			use: "babel-loader"
		}, {
			test: /\.json$/,
			use: "json-loader"
		}]
	},
	devtool: "#source-map",
	plugins: [
		new webpack.BannerPlugin({
			raw: true,
			entryOnly: false,
			banner: `require("source-map-support").install();`
		}),
// 		new webpack.optimize.OccurrenceOrderPlugin()
	]
};
export default configuration;