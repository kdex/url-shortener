import gulp from "gulp";
import gutil from "gulp-util";
import babel from "gulp-babel";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import nodemon from "gulp-nodemon";
import clientConfiguration from "./webpack.config.babel";
import serverConfiguration from "./webpack.server.config.babel";
import config from "./src/config";
import { writeFileSync } from "fs";
import postcss from "gulp-postcss";
import autoPrefixer from "autoprefixer";
import cssNano from "cssnano";
import nested from "postcss-nested";
import sourceMaps from "gulp-sourcemaps";
import cssImport from "postcss-import";
import replace from "gulp-replace";
import re from "src/common/regex.js";
import htmlMin from "gulp-htmlmin";
let finishActivity;
/* nodemon doesn't exit properly */
process.once("SIGINT", () => {
	if (finishActivity) {
		finishActivity();
	}
	process.exit(0);
});
let isNodemonRunning = false;
export function runServer(done) {
	finishActivity = done;
	isNodemonRunning = true;
	return nodemon({
		delay: 1500,
		script: `dist/server/server.js`,
		watch: ["dist/server"]
	});
};
export function js(done) {
	finishActivity = done;
	webpack(serverConfiguration, (err, stats) => {
		if (err) {
			gutil.log(new gutil.PluginError("[webpack]", err.message));
		}
		if (!isNodemonRunning) {
			console.log("Starting nodemon")
			return runServer(done);
		}
	});
}
export function split(done) {
	const { common, server, client } = config;
	writeFileSync(".client.config.js", "export default " + JSON.stringify(Object.assign({}, common, client), null, "\t"));
	writeFileSync(".server.config.js", "export default " + JSON.stringify(Object.assign({}, common, server), null, "\t"));
	done();
}
export function css() {
	const plugins = [
		cssImport(),
		nested(),
		autoPrefixer(),
		cssNano()
	];
	return gulp.src("src/client/css/index.css")
		.pipe(sourceMaps.init())
		.pipe(postcss(plugins))
		.pipe(sourceMaps.write("."))
		.pipe(gulp.dest("assets/css"));
}
export function html() {
	return gulp.src("src/client/index.html")
		.pipe(replace("@KEY_REGEX", re.regex.source))
		.pipe(htmlMin({
			collapseWhitespace: true,
			removeComments: true,
			removeAttributeQuotes: true,
			removeRedundantAttributes: true
		}))
		.pipe(gulp.dest("."));
}
export default gulp.series(
	split,
	gulp.parallel(
		js,
		css,
		html
	)
);