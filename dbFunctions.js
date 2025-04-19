const oracledb = require("oracledb");
const _dbInstance = require("./dbInstance");

class DbFunctions {
    /**
     * @type {oracledb.Connection}
     */
    static dbInstance = _dbInstance.getInstance();
    static async registerUser(username, email, password, birthyear) {
        const sql = `INSERT INTO FELHASZNALO (FELHASZNALONEV, EMAIL, JELSZO, SZULETESI_EV, JOGOSULTSAG) VALUES (:1, :2, :3, :4, :5)`;
        try {
            await DbFunctions.dbInstance.execute(sql, [
                username, email, password, birthyear, 0
            ]);
            await DbFunctions.dbInstance.commit();
            console.log(`Regisztráció siker: ${username}`);
        } catch (e) {
            console.error(e);
        }
    }
}

module.exports = DbFunctions;
