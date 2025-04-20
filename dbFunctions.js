const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const oracledb = require("oracledb");
const _dbInstance = require("./dbInstance");

const tokenPath = path.join(__dirname, (process.env.TOKENPATH || "./tokens.json"));

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

    /**
     * 
     * @param {string} username 
     * @param {string} plainpass
     * @returns {string|null} vagy a token, vagy null ha nem sikerült belépni
     */
    static async loginToken(username, plainpass) {
        const sql = `SELECT * FROM FELHASZNALO WHERE FELHASZNALONEV = :1`;
        let ret = [];
        try {
            ret = await DbFunctions.dbInstance.execute(sql, [
                username
            ], {
                maxRows: 2
            });
        } catch (e) {

        }
        if (ret.length == 0 || ret.length > 1) {
            return null;  // vagy nincs, vagy több van (unique miatt nem lehet)
        }
        const potential = ret[0];
        let authedUser = null;
        const isCorrect = bcrypt.compareSync(plainpass, potential["JELSZO"]);
        if (!isCorrect) return null;
        authedUser = potential;
        // token
        /**
         * @type {Array}
         */
        let allTokens = "[]";
        try {
            allTokens = fs.readFileSync(tokenPath, {
                encoding: "utf-8"
            });

            allTokens = JSON.parse(allTokens);
            allTokens.push({
                userId: authedUser["ID"],
                token: bcrypt.hashSync("" + authedUser["ID"] + Date.now().toString() + Math.random().toString())
            });
            allTokens = JSON.stringify(allTokens, space = 2);

        } catch (e) {
            console.error("Tokenek betöltése/mentése nem sikerült, mind törölve.", e);
            allTokens = "[]";
            fs.writeFileSync(tokenPath, allTokens, {
                encoding: "utf-8",
                mode: "w"
            });
        }
    }

    static async verifyToken(userId, token) {
        /**
         * @type {Array}
         */
        let allTokens = "[]";
        try {
            allTokens = fs.readFileSync(tokenPath, {
                encoding: "utf-8"
            });
            allTokens = JSON.parse(allTokens);
        } catch (e) {

        }
        let correct = false;
        allTokens.forEach(pair => {
            if (pair["userId"] == userId) {
                if (pair["token"] == token) {
                    correct = true;
                }
            }
        })
        return correct;
    }
}

module.exports = DbFunctions;
