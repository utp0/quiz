const dotenv = require("dotenv");
dotenv.config({ path: "./.env.default" });
dotenv.config({ path: "./.env", override: true });
const oracledb = require("oracledb");
const config = {
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    connectString: process.env.DBCONNSTR,
    autoCommit: true
};

class DatabaseInstance {
    /**
     * @type {oracledb.Connection}
     */
    static instance = undefined;

    static async openDB() {
        if (typeof DatabaseInstance.instance !== "undefined") {
            console.error("Adatbázis-kapcsolat már definiált!");
            return;
        }
        DatabaseInstance.instance = await oracledb.getConnection(config);
    }

    /**
     * 
     * @returns {oracledb.Connection}
     */
    static getInstance() {
        return DatabaseInstance.instance;
    }
}

module.exports = {
    getInstance: DatabaseInstance.getInstance,
    openDB: DatabaseInstance.openDB
}