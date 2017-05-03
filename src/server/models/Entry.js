import { TEXT } from "sequelize";
export default sequelize => sequelize.define("entry", {
	shortName: {
		type: TEXT,
		allowNull: false,
		unique: true
	},
	url: {
		type: TEXT,
		allowNull: false
	}
});