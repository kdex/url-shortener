import path from "path";
import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import validURL from "valid-url";
import randToken from "rand-token";
import RateLimit from "express-rate-limit";
import findRoot from "find-root";
import { err, debug } from "print-log";
import re from "../common/regex";
import config, { common } from "../config";
const { server } = config;
function sendNotFound(response) {
	response.status(404).send("404 Not Found");
}
function makeError(errorCode) {
	const error = {
		error: true
	};
	if (errorCode) {
		error.errorCode = errorCode;
	}
	return error;
}
const root = findRoot(__dirname);
export default class APIServer {
	app;
	constructor(database) {
		this.app = express();
		this.db = database;
		const { app } = this;
		const tokens = randToken.generator({
			source: "crypto",
			chars: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
		});
		app.disable("x-powered-by");
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({
			extended: true
		}));
		app.enable("trust proxy");
		const ms = 1;
		const s = 1000 * ms;
		const min = 60 * s;
		const h = 60 * min;
		const limit = RateLimit({
			windowMs: 1 * h,
			delayMs: 10 * ms,
			max: 60,
			global: false
		});
		const generateKey = () => {
			return new Promise(async (resolve, reject) => {
				for (let i = 0; i < server.behavior.retries; ++i) {
					const shortName = tokens.generate(common.style.keys.length);
					const entry = await this.db.findEntry(shortName);
					if (entry) {
						continue;
					}
					else {
						resolve(shortName);
						return;
					}
				}
				reject(null);
			});
		}
		app.get("/", (request, response) => {
			response.sendFile(path.join(root, "index.html"));
		});
		app.use("/assets", express.static("assets"));
		app.post(`/${common.urls.prefix}/create`, limit, async (request, response) => {
			const { body } = request;
			let shortName = decodeURIComponent(body.shortName);
			const { url } = body;
			let errorCode = null;
			try {
				const illegal = common.urls.blacklist.some(bannedURL => url.includes(bannedURL));
				if (illegal) {
					errorCode = "BANNED_URL";
				}
				else {
					if (!shortName) {
						try {
							shortName = await generateKey();
						}
						catch (e) {
							errorCode = "LOW_ENTROPY";
						}
					}
					/* Short name syntax */
					if (!re.regex.test(shortName)) {
						errorCode = "INVALID_KEY";
					}
					/* URL syntax */
					if (!validURL.isUri(url)) {
						errorCode = "INVALID_URL";
					}
					if (!errorCode) {
						await this.db.createEntry({
							url,
							shortName
						});
					}
				}
			}
			catch (e) {
				/* Key already in database */
				err(e);
				errorCode = "KEY_UNAVAILABLE";
			}
			finally {
				if (errorCode) {
					response.send(makeError(errorCode));
				}
				else {
					response.send({
						shortName
					});
				}
			}
		});
		app.use("*", async (request, response) => {
			const shortName = decodeURIComponent(request.originalUrl).substr(1);
			const entry = await this.db.findEntry(shortName);
			if (entry) {
				response.redirect(301, entry.url);
			}
			else {
				sendNotFound(response);
			}
		});
	}
	open() {
		return new Promise(resolve => {
			this.app.listen(server.port, () => {
				resolve();
				debug(`URL shortener is online on port ${server.port}`);
			});
		})
	}
}