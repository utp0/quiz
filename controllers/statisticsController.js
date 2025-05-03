const oracledb = require('oracledb');
const { getInstance } = require('../dbInstance');
const DbFunctions = require('../dbFunctions');

exports.showRankings = async (req, res) => {
    try {
        const connection = getInstance();
        
        // Globális ranglista lekérdezése
        const globalRankings = await connection.execute(
            `SELECT 
                r.ID,
                f.FELHASZNALONEV,
                r.OSSZPONTSZAM,
                RANK() OVER (ORDER BY r.OSSZPONTSZAM DESC) AS HELYEZES
             FROM 
                RANGLISTA r
             JOIN 
                FELHASZNALO f ON r.FELHASZNALO_ID = f.ID
             ORDER BY 
                r.OSSZPONTSZAM DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        res.render('statisztika/ranglista', { 
            rankings: globalRankings.rows,
            title: 'Globális ranglista'
        });
    } catch (err) {
        console.error('Hiba a ranglista lekérdezésekor:', err);
        res.status(500).send('Szerverhiba történt.');
    }
};

exports.showUserStatistics = async (req, res) => {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return res.redirect('/login');
        }
        
        const userId = await DbFunctions.verifyToken(token);
        
        if (!userId) {
            return res.status(401).send('Nincs bejelentkezve, vagy a munkamenet lejárt.');
        }
        
        const connection = getInstance();
        
        // Felhasználó alapadatainak lekérdezése
        const userResult = await connection.execute(
            `SELECT FELHASZNALONEV, EMAIL, SZULETESI_EV
             FROM FELHASZNALO
             WHERE ID = :userId`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).send('Felhasználó nem található');
        }
        
        const user = userResult.rows[0];
        
        // Felhasználó kvíz eredményeinek lekérdezése
        const resultsQuery = await connection.execute(
            `SELECT 
                e.ID,
                e.KVIZ_ID,
                k.NEV AS KVIZ_NEV,
                e.PONTSZAM,
                e.IDOBELYEG
             FROM 
                EREDMENY e
             JOIN 
                KVIZ k ON e.KVIZ_ID = k.ID
             WHERE 
                e.FELHASZNALO_ID = :userId
             ORDER BY 
                e.IDOBELYEG DESC`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Felhasználó statisztikáinak lekérdezése
        const statsQuery = await connection.execute(
            `SELECT 
                s.KVIZ_ID,
                k.NEV AS KVIZ_NEV,
                s.ATLAGOS_KITOLTESI_IDO,
                s.HELYES_VALASZOK_ARANYA,
                COUNT(e.ID) AS KITOLTES_SZAMA
             FROM 
                STATISZTIKA s
             JOIN 
                KVIZ k ON s.KVIZ_ID = k.ID
             LEFT JOIN 
                EREDMENY e ON (e.FELHASZNALO_ID = s.FELHASZNALO_ID AND e.KVIZ_ID = s.KVIZ_ID)
             WHERE 
                s.FELHASZNALO_ID = :userId
             GROUP BY 
                s.KVIZ_ID, k.NEV, s.ATLAGOS_KITOLTESI_IDO, s.HELYES_VALASZOK_ARANYA
             ORDER BY 
                s.HELYES_VALASZOK_ARANYA DESC`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Felhasználó ranglista pozíciójának lekérdezése
        const rankQuery = await connection.execute(
            `SELECT 
                r.OSSZPONTSZAM,
                (SELECT COUNT(*) + 1 FROM RANGLISTA WHERE OSSZPONTSZAM > r.OSSZPONTSZAM) AS HELYEZES,
                (SELECT COUNT(*) FROM RANGLISTA) AS OSSZES_JATEKOS
             FROM 
                RANGLISTA r
             WHERE 
                r.FELHASZNALO_ID = :userId`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        const rankInfo = rankQuery.rows.length > 0 ? rankQuery.rows[0] : { OSSZPONTSZAM: 0, HELYEZES: 0, OSSZES_JATEKOS: 0 };
        
        // Felhasználó témakör szerinti statisztikáinak lekérdezése
        const categoryStatsQuery = await connection.execute(
            `SELECT 
                t.NEV AS TEMAKOR_NEV,
                COUNT(DISTINCT e.ID) AS KITOLTES_SZAMA,
                AVG(e.PONTSZAM) AS ATLAG_PONTSZAM,
                MAX(e.PONTSZAM) AS LEGJOBB_PONTSZAM
            FROM 
                EREDMENY e
            JOIN 
                KVIZ k ON e.KVIZ_ID = k.ID
            JOIN 
                KERDES ker ON ker.KVIZ_ID = k.ID
            JOIN 
                KERDES_TEMAKOR kt ON kt.KERDES_ID = ker.ID
            JOIN 
                TEMAKOR t ON kt.TEMAKOR_ID = t.ID
            WHERE 
                e.FELHASZNALO_ID = :userId
            GROUP BY 
                t.NEV
            ORDER BY 
                AVG(e.PONTSZAM) DESC`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        res.render('statisztika/felhasznalo', {
            user: user,
            results: resultsQuery.rows,
            stats: statsQuery.rows,
            rankInfo: rankInfo,
            categoryStats: categoryStatsQuery.rows
        });
        
    } catch (err) {
        console.error('Hiba a felhasználói statisztikák lekérdezésekor:', err);
        res.status(500).send('Szerverhiba történt.');
    }
};

exports.showQuizStatistics = async (req, res) => {
    const quizId = req.params.id;
    
    try {
        const connection = getInstance();
        
        // Kvíz alapadatainak lekérdezése
        const quizResult = await connection.execute(
            `WITH QUIZ_DATA AS (
                SELECT 
                    k.ID,
                    k.NEV, 
                    k.LEIRAS,
                    (
                        SELECT t.NEV 
                        FROM TEMAKOR t 
                        JOIN KERDES_TEMAKOR kt ON t.ID = kt.TEMAKOR_ID 
                        JOIN KERDES ker ON kt.KERDES_ID = ker.ID 
                        WHERE ker.KVIZ_ID = k.ID 
                        GROUP BY t.NEV 
                        ORDER BY COUNT(*) DESC 
                        FETCH FIRST 1 ROW ONLY
                    ) AS TEMAKOR_NEV
                FROM KVIZ k
                WHERE k.ID = :quizId
            )
            SELECT 
                qd.NEV,
                qd.LEIRAS,
                qd.TEMAKOR_NEV,
                COUNT(ker.ID) AS KERDESEK_SZAMA
            FROM QUIZ_DATA qd
            LEFT JOIN KERDES ker ON ker.KVIZ_ID = qd.ID
            GROUP BY qd.NEV, qd.LEIRAS, qd.TEMAKOR_NEV`,
            [quizId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        if (quizResult.rows.length === 0) {
            return res.status(404).send('A megadott kvíz nem található.');
        }
        
        const quiz = quizResult.rows[0];
        
        // Kvíz kitöltési statisztikák
        const completionStats = await connection.execute(
            `SELECT 
                COUNT(e.ID) AS KITOLTES_SZAMA,
                AVG(e.PONTSZAM) AS ATLAG_PONTSZAM,
                MAX(e.PONTSZAM) AS LEGJOBB_PONTSZAM,
                MIN(e.PONTSZAM) AS LEGROSSZABB_PONTSZAM
             FROM 
                EREDMENY e
             WHERE 
                e.KVIZ_ID = :quizId`,
            [quizId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Top 10 eredmény a kvízhez
        const topResults = await connection.execute(
            `SELECT 
                f.FELHASZNALONEV AS FELHASZNALO_NEV,
                e.PONTSZAM,
                e.IDOBELYEG
             FROM 
                EREDMENY e
             JOIN 
                FELHASZNALO f ON e.FELHASZNALO_ID = f.ID
             WHERE 
                e.KVIZ_ID = :quizId
             ORDER BY 
                e.PONTSZAM DESC, e.IDOBELYEG ASC
             FETCH FIRST 10 ROWS ONLY`,
            [quizId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Nehézségi szint szerinti statisztikák
        const difficultyStats = await connection.execute(
            `SELECT 
                k.NEHEZSEGI_SZINT,
                COUNT(k.ID) AS KERDESEK_SZAMA,
                (
                    SELECT COUNT(*) 
                    FROM VALASZ v 
                    WHERE v.KERDES_ID = k.ID AND v.HELYES = 1
                ) AS HELYES_VALASZOK_SZAMA
             FROM 
                KERDES k
             WHERE 
                k.KVIZ_ID = :quizId
             GROUP BY 
                k.NEHEZSEGI_SZINT, k.ID
             ORDER BY 
                k.NEHEZSEGI_SZINT`,
            [quizId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        const statsFromStatsTable = await connection.execute(
            `SELECT 
                AVG(s.HELYES_VALASZOK_ARANYA) AS ATLAGOS_HELYES_VALASZ_ARANY
             FROM 
                STATISZTIKA s
             WHERE 
                s.KVIZ_ID = :quizId`,
            [quizId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        res.render('statisztika/kviz', {
            quiz: quiz,
            completionStats: completionStats.rows[0],
            topResults: topResults.rows,
            difficultyStats: difficultyStats.rows,
            statsFromStatsTable: statsFromStatsTable.rows[0]
        });
        
    } catch (err) {
        console.error('Hiba a kvíz statisztikák lekérdezésekor:', err);
        res.status(500).send('Szerverhiba történt.');
    }
};

exports.showGlobalStatistics = async (req, res) => {
    try {
        const connection = getInstance();
        
        // Témakörök népszerűsége (kitöltések száma szerint)
        //nem jo lekerdezes (k.temakor_id)
        const categoryPopularity = await connection.execute(
            `SELECT 
                t.NEV AS TEMAKOR_NEV,
                COUNT(DISTINCT e.ID) AS KITOLTES_SZAMA
            FROM 
                TEMAKOR t
            LEFT JOIN 
                KERDES_TEMAKOR kt ON t.ID = kt.TEMAKOR_ID
            LEFT JOIN 
                KERDES ker ON kt.KERDES_ID = ker.ID
            LEFT JOIN 
                KVIZ k ON ker.KVIZ_ID = k.ID
            LEFT JOIN 
                EREDMENY e ON k.ID = e.KVIZ_ID
            GROUP BY 
                t.NEV
            ORDER BY 
                COUNT(DISTINCT e.ID) DESC`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Legnépszerűbb kvízek
        const popularQuizzes = await connection.execute(
            `SELECT 
                k.ID,
                k.NEV,
                COUNT(e.ID) AS KITOLTES_SZAMA,
                AVG(e.PONTSZAM) AS ATLAG_PONTSZAM
             FROM 
                KVIZ k
             LEFT JOIN 
                EREDMENY e ON k.ID = e.KVIZ_ID
             GROUP BY 
                k.ID, k.NEV
             ORDER BY 
                COUNT(e.ID) DESC
             FETCH FIRST 10 ROWS ONLY`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Legaktívabb felhasználók
        const activeUsers = await connection.execute(
            `SELECT 
                f.FELHASZNALONEV,
                COUNT(e.ID) AS KITOLTES_SZAMA,
                r.OSSZPONTSZAM
             FROM 
                FELHASZNALO f
             LEFT JOIN 
                EREDMENY e ON f.ID = e.FELHASZNALO_ID
             LEFT JOIN
                RANGLISTA r ON f.ID = r.FELHASZNALO_ID
             GROUP BY 
                f.FELHASZNALONEV, r.OSSZPONTSZAM
             ORDER BY 
                COUNT(e.ID) DESC
             FETCH FIRST 10 ROWS ONLY`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // Korosztályos statisztikák (ha a felhasználó táblában van kor vagy születési dátum)
        let ageStats = [];
        try {
            ageStats = (await connection.execute(
                `SELECT 
                    CASE 
                        WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - TO_NUMBER(SZULETESI_EV)) < 18 THEN '18 alatt'
                        WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - TO_NUMBER(SZULETESI_EV)) BETWEEN 18 AND 25 THEN '18-25'
                        WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - TO_NUMBER(SZULETESI_EV)) BETWEEN 26 AND 35 THEN '26-35'
                        WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - TO_NUMBER(SZULETESI_EV)) BETWEEN 36 AND 50 THEN '36-50'
                        ELSE '50 felett'
                    END AS KORCSOPORT,
                    COUNT(DISTINCT f.ID) AS FELHASZNALOK_SZAMA,
                    AVG(r.OSSZPONTSZAM) AS ATLAG_PONTSZAM
                FROM 
                    FELHASZNALO f
                LEFT JOIN 
                    RANGLISTA r ON f.ID = r.FELHASZNALO_ID
                WHERE
                    f.SZULETESI_EV IS NOT NULL
                GROUP BY 
                    CASE 
                        WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - TO_NUMBER(SZULETESI_EV)) < 18 THEN '18 alatt'
                        WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - TO_NUMBER(SZULETESI_EV)) BETWEEN 18 AND 25 THEN '18-25'
                        WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - TO_NUMBER(SZULETESI_EV)) BETWEEN 26 AND 35 THEN '26-35'
                        WHEN (EXTRACT(YEAR FROM CURRENT_DATE) - TO_NUMBER(SZULETESI_EV)) BETWEEN 36 AND 50 THEN '36-50'
                        ELSE '50 felett'
                    END
                ORDER BY 
                    CASE KORCSOPORT
                        WHEN '18 alatt' THEN 1
                        WHEN '18-25' THEN 2
                        WHEN '26-35' THEN 3
                        WHEN '36-50' THEN 4
                        WHEN '50 felett' THEN 5
                    END`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            )).rows;
        } catch (error) {
            console.error('Korosztályos statisztikák lekérdezése nem sikerült:', error);
        }
        
        res.render('statisztika/globalis', {
            categoryPopularity: categoryPopularity.rows,
            popularQuizzes: popularQuizzes.rows,
            activeUsers: activeUsers.rows,
            ageStats: ageStats
        });
        
    } catch (err) {
        console.error('Hiba a globális statisztikák lekérdezésekor:', err);
        res.status(500).send('Szerverhiba történt.');
    }
};