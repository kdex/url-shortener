import username from "username";
import deepAssign from "deep-assign";
import { server, client } from "../config.js";
const defaultConfig = {
	common: {
		connection: {
			host: "localhost",
			path: "socket/api",
			port: 4050
		},
		style: {
			keys: {
				length: 6
			},
			regex: {
				noUnsafeCharacters: "[%\\\\#]",
				noLeadingSpaces: true,
				noTrailingSpaces: true,
				noConsecutiveSpaces: true,
				noRelativePaths: true
			}
		},
		urls: {
			blacklist: [],
			prefix: "api"
		}
	},
	client: {},
	server: {
		behavior: {
			retries: 3
		},
		port: 3000,
		psql: {
			user: username.sync(),
			database: "url-shortener"
		}
	}
};
const overrides = {
	client,
	server
};
deepAssign(defaultConfig, overrides);
for (const part of ["server", "client"]) {
	for (const prop in defaultConfig[part]) {
		if (defaultConfig.common.hasOwnProperty(prop)) {
			deepAssign(defaultConfig.common[prop], defaultConfig[part][prop]);
		}
	}
}
export const common = defaultConfig.common;
export default defaultConfig;