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
    static dbInstance = () => {
        return _dbInstance.getInstance();
    };
    static async registerUser(username, email, password, birthyear) {
        const sql = `INSERT INTO FELHASZNALO (FELHASZNALONEV, EMAIL, JELSZO, SZULETESI_EV, JOGOSULTSAG) VALUES (:1, :2, :3, :4, :5)`;
        try {
            await DbFunctions.dbInstance().execute(sql, [
                username, email, bcrypt.hashSync(password, 10), birthyear, 0
            ]);
            await DbFunctions.dbInstance().commit();
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
            ret = await DbFunctions.dbInstance().execute(sql, [
                username
            ], {
                maxRows: 2,
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });
        } catch (e) {
            console.error(e);
        }
        if (ret.rows.length == 0 || ret.rows.length > 1) {
            return null;  // vagy nincs, vagy több van (unique miatt nem lehet)
        }
        const potential = ret.rows[0];
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
        } catch (e) {
            console.error("Tokenek betöltése/mentése nem sikerült, mind törölve.", e);
            allTokens = "[]";
            fs.writeFileSync(tokenPath, allTokens, {
                encoding: "utf-8"
            });
        }

        let currentToken = null;

        try {
            allTokens = JSON.parse(allTokens);
            currentToken = {
                userId: authedUser["ID"],
                token: btoa(bcrypt.hashSync("" + authedUser["ID"] + Date.now().toString() + Math.random().toString(), 10))
            };
            allTokens.push(currentToken);
            allTokens = JSON.stringify(allTokens, null, 2);
        } catch (e) {
            console.error("Tokenek betöltése/mentése nem sikerült, mind törölve.", e);
            allTokens = "[]";
        } finally {
            fs.writeFileSync(tokenPath, allTokens, {
                encoding: "utf-8"
            });
        }
        return currentToken;
    }

    /**
     * 
     * @param {string} token 
     * @returns {Promise<number|false>} userId vagy hamis
     */
    static async verifyToken(token) {
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
            console.error("Tokenek beolvasása nem sikerült!", e);
        }
        let correct = false;
        allTokens.forEach(pair => {
            if (pair["token"] == token) {
                correct = pair["userId"];
            }
        })
        return correct;
    }

    static async getUserById(userId) {
        const sql = `SELECT * FROM FELHASZNALO WHERE ID = :1`;
        let ret = [];
        try {
            ret = await DbFunctions.dbInstance().execute(sql, [
                userId
            ], {
                maxRows: 2,
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });
        } catch (e) {
            console.error(`Hiba felhasználó id alapján lekérése közben (${userId}), e`);
        }
        if (!ret.rows || ret.rows.length == 0 || ret.rows.length > 1) {
            return null;  // vagy nincs, vagy több van (unique miatt nem lehet)
        }
        return ret.rows[0];
    }

    static async getAllTemakor() {
        const connection = await _dbInstance.getConnection();
        try {
            const result = await connection.execute(
                `SELECT id, nev FROM Temakor ORDER BY nev`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            return result.rows;
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }

    static async createTemakor(nev) {
        const connection = await _dbInstance.getConnection();
        try {
            const maxIdResult = await connection.execute(
                `SELECT NVL(MAX(id), 0) + 1 as next_id FROM Temakor`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            
            const nextId = maxIdResult.rows[0].NEXT_ID;
            
            await connection.execute(
                `INSERT INTO Temakor (id, nev) VALUES (:id, :nev)`,
                { id: nextId, nev: nev },
                { autoCommit: true }
            );
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error(err);
                }
            }
        }
    }
}

module.exports = DbFunctions;
