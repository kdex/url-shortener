import Database from "./Database";
import { err } from "print-log";
import APIServer from "./APIServer";
for (const event of ["unhandledRejection", "uncaughtException"]) {
	process.on(event, e => {
		err(e);
	});
}
(async () => {
	const db = new Database();
	try {
		await db.initialize();
		const server = new APIServer(db);
		await server.open();
	}
	catch (e) {
		err(e);
	}
})();