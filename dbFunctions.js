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
                username, email, bcrypt.hashSync(password, 10), birthyear, "felhasznalo"
            ]);
            await DbFunctions.dbInstance().commit();
            console.log(`Regisztráció siker: ${username}`);
        } catch (e) {
            console.error(e);
        }
    }

    static async swapPerms(userId) {
        let user = null;
        user = await DbFunctions.getUserById(userId);
        if(user == null) {
            return false;
        }
        let newperm = "felhasznalo";
        if(user["JOGOSULTSAG"] == "felhasznalo") {
            newperm = "admin";
        }
        const sql = `
            UPDATE FELHASZNALO SET JOGOSULTSAG = :jog WHERE ID = :id
        `;
        try {
            await DbFunctions.dbInstance().execute(sql, {
                jog: newperm,
                id: userId
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    static async deleteUser(userId) {
        const sql = `
            DELETE FROM FELHASZNALO WHERE ID = :1
        `;
        try {
            const result = await DbFunctions.dbInstance().execute(sql, [userId],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            return true;
        } catch (e) {
            console.error(`Nem sikerült a felhasználó törlése (${userId})\n`, e);
            throw e;
        }
    }

    /**
     * 
     * @param {string} username 
     * @param {string} plainpass
     * @returns {Promise<string|null>} vagy a token, vagy null ha nem sikerült belépni
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

        /* Felhasználó bejelentkezésének logolása tárolt eljárással */

        try {
            const logSql = `BEGIN :ret := LOG_USER_LOGIN(:user_id); END;`;
            const logParams = {
                ret: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
                user_id: authedUser["ID"]
            };
            const logResult = await DbFunctions.dbInstance().execute(logSql, logParams);

            if (logResult.outBinds.ret !== 1) {
                console.error(`DB eljárás LOG_USER_LOGIN sikertelen, user ID: ${authedUser["ID"]}`);
            } else {
                // console.log("sikerült jóvan")
            }
        } catch (logError) {
            console.error(`Nem sikerült a LOG_USER_LOIGN, user ID: ${authedUser["ID"]}:`, logError);
        }

        /* ======================================================== */


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
            allTokens = [];
        }
        let correct = false;
        allTokens.forEach(pair => {
            if (pair["token"] == token) {
                correct = pair["userId"];
            }
        })
        return correct;
    }

    static deleteToken(token) {
        let allTokens = [];
        try {
            allTokens = fs.readFileSync(tokenPath, {
                encoding: "utf-8"
            });
            allTokens = JSON.parse(allTokens);
        } catch (e) {
            console.error("Tokenek beolvasása nem sikerült!", e);
            return false;  // nemsikerült de kb mindegy
        }
        allTokens = allTokens.filter(element => {
            if (element["token"] == token) return false;
            return true;
        });
        try {
            allTokens = JSON.stringify(allTokens, null, 2);
            fs.writeFileSync(tokenPath, allTokens, {
                encoding: "utf-8"
            });
            return true;
        } catch (e) {
            console.error("Kijelentkezéskori token törlése nem sikerült.", e);
            return false;
        }
    }

    static async getUserById(userId) {
        if (userId === false) return null;  // kliens süti nélkül ne próbáljuk
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
            console.error(`Hiba felhasználó id alapján lekérése közben (${userId})`, e);
        }
        if (!ret.rows || ret.rows.length == 0 || ret.rows.length > 1) {
            return null;  // vagy nincs, vagy több van (unique miatt nem lehet)
        }
        return ret.rows[0];
    }

    static async updateUserProfile(userId, username, email, hashedPassword, birthYear) {
        try {
            const fields = [];
            const values = [];
    
            if (username) {
                fields.push(`FELHASZNALONEV = :${fields.length + 1}`);
                values.push(username);
            }
    
            if (email) {
                fields.push(`EMAIL = :${fields.length + 1}`);
                values.push(email);
            }
    
            if (hashedPassword) {
                fields.push(`JELSZO = :${fields.length + 1}`);
                values.push(hashedPassword);
            }
    
            if (birthYear) {
                fields.push(`SZULETESI_EV = :${fields.length + 1}`);
                values.push(birthYear);
            }
    
            if (fields.length === 0) throw new Error("Nincs frissítendő mező.");
    
            const sql = `UPDATE FELHASZNALO SET ${fields.join(', ')} WHERE ID = :${fields.length + 1}`;
            values.push(userId);
    
            const result = await DbFunctions.dbInstance().execute(sql, values);
            await DbFunctions.dbInstance().commit();
    
            if (result.rowsAffected === 0) {
                throw new Error("A felhasználó nem található!");
            }
    
            console.log(`Felhasználó frissítve: ID ${userId}`);
            return true;
        } catch (e) {
            console.error("Hiba a profil frissítésekor:", e);
            throw e;
        }
    }
    
    

    static async getAllUsers() {
        const sql = `
        SELECT
            felhasznalo.id ID,
            felhasznalo.felhasznalonev FELHASZNALONEV,
            felhasznalo.email EMAIL,
            felhasznalo.szuletesi_ev SZULETESI_EV,
            felhasznalo.jogosultsag JOGOSULTSAG
        FROM
            felhasznalo
        ORDER BY
            felhasznalo.id DESC`;
        let ret = [];
        try {
            ret = await DbFunctions.dbInstance().execute(sql, [], {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });
        } catch (e) {
            console.error(`Hiba az összes felhasználó lekérése közben.\n`, e);
        }
        if (!ret.rows || ret.rows.length == 0) {
            return null;
        }
        return ret.rows;
    }

    static async getAllTemakor() {
        const sql = `SELECT id, nev FROM Temakor ORDER BY nev`;
        try {
            const result = await DbFunctions.dbInstance().execute(sql, []);
            return result.rows.map(row => ({ id: row[0], nev: row[1] }));
        } catch (e) {
            console.error("Hiba a témakörök lekérdezésénél:", e);
            throw e;
        }
    }

    static async createTemakor(nev) {
        const checkSql = `SELECT COUNT(*) FROM Temakor WHERE nev = :1`;
        try {
            const checkResult = await DbFunctions.dbInstance().execute(checkSql, [nev]);
            if (checkResult.rows[0][0] > 0) {
                throw new Error("Már létezik ilyen nevű témakör!");
            }

            const idSql = `SELECT NVL(MAX(id), 0) + 1 FROM Temakor`;
            const idResult = await DbFunctions.dbInstance().execute(idSql, []);
            const nextId = idResult.rows[0][0];

            const insertSql = `INSERT INTO Temakor (id, nev) VALUES (:1, :2)`;
            await DbFunctions.dbInstance().execute(insertSql, [nextId, nev]);
            await DbFunctions.dbInstance().commit();

            console.log(`Új témakör létrehozva: ${nev} (ID: ${nextId})`);
            return nextId;
        } catch (e) {
            console.error("Hiba a témakör létrehozásakor:", e);
            throw e;
        }
    }

    static async getTekorById(id) {
        const sql = `SELECT id, nev FROM Temakor WHERE id = :1`;
        try {
            const result = await DbFunctions.dbInstance().execute(sql, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            return {
                id: result.rows[0][0],
                nev: result.rows[0][1]
            };
        } catch (e) {
            console.error("Hiba a témakör lekérdezésénél:", e);
            throw e;
        }
    }

    static async updateTemakor(id, nev) {
        const checkSql = `SELECT COUNT(*) FROM Temakor WHERE nev = :1 AND id != :2`;
        try {
            const checkResult = await DbFunctions.dbInstance().execute(checkSql, [nev, id]);
            if (checkResult.rows[0][0] > 0) {
                throw new Error("Már létezik ilyen nevű témakör!");
            }

            const updateSql = `UPDATE Temakor SET nev = :1 WHERE id = :2`;
            const result = await DbFunctions.dbInstance().execute(updateSql, [nev, id]);
            await DbFunctions.dbInstance().commit();

            if (result.rowsAffected === 0) {
                throw new Error("A témakör nem található!");
            }

            console.log(`Témakör frissítve: ${nev} (ID: ${id})`);
            return true;
        } catch (e) {
            console.error("Hiba a témakör frissítésekor:", e);
            throw e;
        }
    }

    static async deleteTemakor(id) {
        try {
            const sql = `DELETE FROM Temakor WHERE id = :1`;
            const result = await DbFunctions.dbInstance().execute(sql, [id]);
            await DbFunctions.dbInstance().commit();

            if (result.rowsAffected === 0) {
                throw new Error("A témakör nem található!");
            }

            console.log(`Témakör törölve: ID: ${id}`);
            return true;
        } catch (e) {
            console.error("Hiba a témakör törlésekor:", e);
            throw e;
        }
    }

    /**
    * @param {string} searchTerm 
    * @returns {Promise<Array>} 
    */
    static async searchKviz(searchTerm) {
        const sql = `
            SELECT
                k.id,
                k.nev,
                k.leiras,
                k.letrehozas_datuma,
                f.FELHASZNALONEV AS keszito_nev
            FROM Kviz k
            LEFT JOIN FELHASZNALO f ON k.felhasznalo_id = f.ID
            WHERE LOWER(k.nev) LIKE LOWER(:searchTerm)
            OR LOWER(k.leiras) LIKE LOWER(:searchTerm)
            ORDER BY k.letrehozas_datuma DESC
        `;

        try {
            const params = {
                searchTerm: `%${searchTerm}%`
            };
        
            const result = await DbFunctions.dbInstance().execute(sql, params);

            return result.rows.map(row => ({
                id: row[0],
                nev: row[1],
                leiras: row[2],
                letrehozas_datuma: row[3],
                keszito_nev: row[4] || "Ismeretlen"
            }));
        } catch (e) {
            console.error("Hiba a kvízek keresésénél:", e);
            throw e;
        }
    }

    static async getAllKviz() {
        const sql = `
            SELECT
                k.id,
                k.nev,
                k.leiras,
                k.letrehozas_datuma,
                f.FELHASZNALONEV AS keszito_nev
            FROM Kviz k
            LEFT JOIN FELHASZNALO f ON k.felhasznalo_id = f.ID
            ORDER BY k.letrehozas_datuma DESC
        `;

        try {
            const result = await DbFunctions.dbInstance().execute(sql, []);

            return result.rows.map(row => ({
                id: row[0],
                nev: row[1],
                leiras: row[2],
                letrehozas_datuma: row[3],
                keszito_nev: row[4] || "Ismeretlen"
            }));
        } catch (e) {
            console.error("Hiba a kvízek lekérdezésénél:", e);
            throw e;
        }
    }

    static async getKvizById(id) {
        const sql = `
            SELECT
                k.id,
                k.nev,
                k.leiras,
                k.letrehozas_datuma,
                k.felhasznalo_id,
                f.FELHASZNALONEV AS keszito_nev
            FROM Kviz k
            LEFT JOIN FELHASZNALO f ON k.felhasznalo_id = f.ID
            WHERE k.id = :1
        `;

        try {
            const result = await DbFunctions.dbInstance().execute(sql, [id]);

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row[0],
                nev: row[1],
                leiras: row[2],
                letrehozas_datuma: row[3],
                felhasznalo_id: row[4],
                keszito_nev: row[5] || 'Ismeretlen'
            };
        } catch (e) {
            console.error("Hiba a kvíz lekérdezésénél:", e);
            throw e;
        }
    }

    static async createKviz(nev, leiras, felhasznaloId) {
        const sql = `
            INSERT INTO Kviz (id, nev, leiras, letrehozas_datuma, felhasznalo_id)
            VALUES (kviz_seq.NEXTVAL, :1, :2, SYSDATE, :3)
        `;
        try {
            await DbFunctions.dbInstance().execute(sql, [nev, leiras, felhasznaloId], { autoCommit: true });
        } catch (e) {
            console.error("Hiba a kvíz létrehozásánál:", e);
            throw e;
        }
    }

    static async updateKviz(id, nev, leiras) {
        const sql = `UPDATE Kviz SET nev = :1, leiras = :2 WHERE id = :3`;
        try {
            await DbFunctions.dbInstance().execute(sql, [nev, leiras, id], { autoCommit: true });
        } catch (e) {
            console.error("Hiba a kvíz frissítésénél:", e);
            throw e;
        }
    }

    static async deleteKviz(id) {
        const sql = `DELETE FROM Kviz WHERE id = :1`;
        try {
            await DbFunctions.dbInstance().execute(sql, [id], { autoCommit: true });
        } catch (e) {
            console.error("Hiba a kvíz törlésénél:", e);
            throw e;
        }
    }

    static async getAllKerdes() {
        const sql = `SELECT id, szoveg FROM KERDES ORDER BY szoveg`;
        try {
            const result = await DbFunctions.dbInstance().execute(sql, [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            return result.rows.map(row => ({ id: row["ID"], nev: row["SZOVEG"] }));
        } catch (e) {
            console.error("Hiba a kérdések lekérdezésénél:", e);
            throw e;
        }
    }

    static async createKerdes(szoveg, k1, k2, k3, k4, correctIndex) {
        const checkSql = `SELECT COUNT(*) FROM KERDES WHERE SZOVEG = :1`;
        try {
            const checkResult = await DbFunctions.dbInstance().execute(checkSql, [szoveg]);
            if (checkResult.rows[0][0] > 0) {
                throw (new Error("Már létezik ez a kérdés!"));
            }

            const idSql = `SELECT NVL(MAX(id), 0) + 1 FROM KERDES`;
            const idResult = await DbFunctions.dbInstance().execute(idSql, []);
            //const nextId = idResult.rows[0][0];

            const insertSql = `INSERT INTO KERDES (szoveg, kviz_id) VALUES (:1, :2)`;
            await DbFunctions.dbInstance().execute(insertSql, [szoveg, 99999]);
            await DbFunctions.dbInstance().commit();

            const qsql = `INSERT INTO VALASZ (KERDES_ID, SZOVEG, HELYES) VALUES (:1, :2, :3)`;
            const xd = await DbFunctions.dbInstance().execute(`SELECT max(id) asd FROM KERDES`);
            let kindex = xd.rows[0][0];
            const tomb = [k1, k2, k3, k4];
            for(let qi = 0; qi < 4; qi++){
                let asd = qi.toString() == correctIndex.toString();
                let valasz = tomb[qi];
                console.log(valasz);
                await DbFunctions.dbInstance().execute(qsql, [kindex, valasz, asd ? 1 : 0]);
            }

            console.log(`Új kérdés létrehozva: ${szoveg}`);
        } catch (e) {
            console.error("Hiba a kérdés létrehozásakor:", e);
            throw e;
        }
    }

    static async getKerdesById(id) {
        const sql = `SELECT id, szoveg FROM KERDES WHERE id = :1`;
        try {
            const result = await DbFunctions.dbInstance().execute(sql, [id],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            if (result.rows.length === 0) {
                return null;
            }

            return {
                id: result.rows[0]["ID"],
                szoveg: result.rows[0]["SZOVEG"]
            };
        } catch (e) {
            console.error("Hiba a témakör lekérdezésénél:", e);
            throw e;
        }
    }

    static async updateKerdes(id, szoveg) {
        const checkSql = `SELECT COUNT(*) FROM KERDES WHERE szoveg = :1 AND id != :2`;
        try {
            const checkResult = await DbFunctions.dbInstance().execute(checkSql, [szoveg, id]);
            if (checkResult.rows[0][0] > 0) {
                throw new Error("Már létezik ilyen kérdés!");
            }

            const updateSql = `UPDATE KERDES SET szoveg = :1 WHERE id = :2`;
            const result = await DbFunctions.dbInstance().execute(updateSql, [szoveg, id]);
            await DbFunctions.dbInstance().commit();

            if (result.rowsAffected === 0) {
                throw new Error("A kérdés nem található!");
            }

            console.log(`Kérdés frissítve: ${szoveg}`);
            return true;
        } catch (e) {
            console.error("Hiba a kérdés frissítésekor:", e);
            throw e;
        }
    }

    static async deleteKerdes(id) {
        try {
            const sql = `DELETE FROM KERDES WHERE id = :1`;
            const result = await DbFunctions.dbInstance().execute(sql, [id]);
            await DbFunctions.dbInstance().commit();

            if (result.rowsAffected === 0) {
                throw new Error("A kérdés nem található!");
            }

            console.log(`Kérdés törölve: ID: ${id}`);
            return true;
        } catch (e) {
            console.error("Hiba a kérdés törlésekor:", e);
            throw e;
        }
    }

    static async getAllJatekszoba() {
        const sql = `
            SELECT
                js.ID, js.NEV, js.MAX_JATEKOS, js.FELHASZNALO_ID, js.KVIZ_ID,
                kv.NEV AS KVIZ_NEV
            FROM Jatekszoba js
            LEFT JOIN Kviz kv ON js.kviz_id = kv.id
            ORDER BY js.NEV
        `;
        try {
            const result = await DbFunctions.dbInstance().execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            return result.rows;
        } catch (e) {
            console.error("Hiba a játékszobák lekérdezésekor:", e);
            throw e;
        }
    }


    static async createJatekszoba(nev, felhasznaloId, maxJatekos, kvizId) {
        const checkSql = `SELECT COUNT(*) FROM Jatekszoba WHERE nev = :1`;
        if (!nev || !felhasznaloId || !maxJatekos || !kvizId || maxJatekos < 2) {
            throw new Error("Hiányos vagy érvénytelen adatok a játékszoba létrehozásához.");
        }
        try {
            const checkResult = await DbFunctions.dbInstance().execute(checkSql, [nev]);
            if (checkResult.rows[0][0] > 0) {
                throw new Error("Már létezik ilyen nevű játékszoba!");
            }

            // const idSql = `SELECT NVL(MAX(id), 0) + 1 FROM Jatekszoba`;
            // const idResult = await DbFunctions.dbInstance().execute(idSql, []);
            // const nextId = idResult.rows[0][0];

            const insertSql = `
                INSERT INTO Jatekszoba (nev, felhasznalo_id, max_jatekos, kviz_id)
                VALUES (:1, :2, :3, :4)
            `;
            await DbFunctions.dbInstance().execute(insertSql, [nev, felhasznaloId, maxJatekos, kvizId]);
            await DbFunctions.dbInstance().commit();

            console.log(`Új játékszoba létrehozva: ${nev}`);
        } catch (e) {
            console.error("Hiba a játékszoba létrehozásakor:", e);
            throw e;
        }
    }

    static async getJatekszobaById(id) {
        const sql = `
            SELECT
                js.ID, js.NEV, js.MAX_JATEKOS, js.FELHASZNALO_ID, js.KVIZ_ID,
                kv.NEV AS KVIZ_NEV
            FROM Jatekszoba js
            LEFT JOIN Kviz kv ON js.kviz_id = kv.id
            WHERE js.id = :1
        `;
        try {
            const result = await DbFunctions.dbInstance().execute(sql, [id], {
                maxRows: 1,
                outFormat: oracledb.OUT_FORMAT_OBJECT
            });

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (e) {
            console.error("Hiba a játékszoba lekérdezésekor:", e);
            throw e;
        }
    }

    static async updateJatekszoba(id, nev, maxJatekos, kvizId) {
        if (!nev || !felhasznaloId || !maxJatekos || !kvizId || maxJatekos < 2) {
            throw new Error("Hiányos vagy érvénytelen adatok a játékszoba létrehozásához.");
        }

        const updateSql = `UPDATE Jatekszoba SET nev = :1, max_jatekos = :2, kviz_id = :3 WHERE id = :4`;
        try {
            const result = await DbFunctions.dbInstance().execute(updateSql, [nev, maxJatekos, kvizId, id]);
            if (result.rowsAffected === 0) {
                throw new Error("A játékszoba nem található a frissítéshez!");
            }
            console.log(`Játékszoba frissítve: ${nev} (ID: ${id})`);
            return true;
        } catch (e) {
            console.error("Hiba a játékszoba frissítésekor:", e);
            throw e;
        }
    }

    static async checkFelhSzobaEredmeny(userId, jatekszobaId, kvizId) {
        if (!userId || !jatekszobaId || !kvizId) return false;
        const sql = `SELECT COUNT(*) AS COUNT FROM Eredmeny WHERE FELHASZNALO_ID = :1 AND JATEKSZOBA_ID = :2 AND KVIZ_ID = :3`;
        try {
            const result = await DbFunctions.dbInstance().execute(sql, [userId, jatekszobaId, kvizId], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            return result.rows[0].COUNT > 0;
        } catch (e) {
            console.error("Hiba az eredmény ellenőrzésekor:", e);
            return false;
        }
    }

    static async deleteJatekszoba(id) {
        try {
            const sql = `DELETE FROM Jatekszoba WHERE id = :1`;
            const result = await DbFunctions.dbInstance().execute(sql, [id]);
            await DbFunctions.dbInstance().commit();

            if (result.rowsAffected === 0) {
                throw new Error("A játékszoba nem található!");
            }

            console.log(`Játékszoba törölve: ID: ${id}`);
            return true;
        } catch (e) {
            console.error("Hiba a játékszoba törlésekor:", e);
            throw e;
        }
    }

    static async getStatsForUser(userId) {
        if (!userId) return null;
        const sql = `
        SELECT
            s.ID,
            s.FELHASZNALO_ID,
            s.KVIZ_ID,
            s.ATLAGOS_KITOLTESI_IDO,
            s.HELYES_VALASZOK_ARANYA
        FROM
            STATISZTIKA s
        INNER JOIN (
            SELECT
                MAX(ID) AS max_id
            FROM
                STATISZTIKA
            WHERE
                FELHASZNALO_ID = :1
            GROUP BY
                KVIZ_ID
        ) latest ON s.ID = latest.max_id
        `;
        try {
            const result = await DbFunctions.dbInstance().execute(sql, [userId],
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );
            return result.rows ?? null;
        } catch (e) {
            console.error(`Hiba felhasználói statisztikák lekérésekor! userId: ${userId}`, e);
            return null;
        }
    }

}

module.exports = DbFunctions;
