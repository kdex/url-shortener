import createEntry from "./models/Entry";
import Sequelize, { TEXT, DATE, Op } from "sequelize";
import config from "/.server.config";
import pgTools from "pgtools";
import { log, err, warn, debug } from "print-log";
async function createDatabase() {
	return new Promise((resolve, reject) => {
		const { database, ...options } = config.psql;
		pgTools.createdb(options, database, (e, reply) => {
			if (e) {
				if (e.name === "duplicate_database") {
					resolve();
				}
				else {
					reject(e);
				}
			}
			else {
				log(`Database "${database}" successfully created.`);
				resolve(reply);
			}
		});
	});
}
export default class Database {
	connection;
	Entry;
	async createEntry({
		shortName,
		url
	}) {
		return this.Entry.create({
			shortName,
			url
		});
	}
	async findEntry(shortName) {
		return this.Entry.findOne({
			where: {
				shortName
			}
		});
	}
	async initialize() {
		await createDatabase();
		this.connection = new Sequelize(config.psql.database, config.psql.user, null, {
			dialect: "postgres",
			logging: log,
			operatorsAliases: false
		});
		this.Entry = createEntry(this.connection);
		try {
			await createDatabase();
		}
		catch (e) {
			if (e.name !== "duplicate_database") {
				throw e;
			}
		}
		/*
		* Create any missing tables, but drop them first.
		* This way, we always get a fresh state once we restart.
		*/
		await this.connection.sync({
			/* Comment this line in to delete everything.  */
// 			force: true,
			logging: log
		});
		return this.connection;
	}
}