const oracledb = require('oracledb');
const { getInstance } = require('../dbInstance');
const DbFunctions = require('../dbFunctions');

exports.startQuiz = async (req, res) => {
    const quizId = req.params.id;
    const roomId = req.query.room || null;

    try {
        const connection = getInstance();

        const result = await connection.execute(
            `SELECT 
                k.id AS kerdes_id,
                k.szoveg AS kerdes_szoveg,
                k.nehezsegi_szint,
                k.idokorlat,
                v.id AS valasz_id,
                v.szoveg AS valasz_szoveg,
                v.helyes
             FROM 
                Kerdes k
             JOIN 
                Valasz v ON k.id = v.Kerdes_id
             WHERE 
                k.Kviz_id = :quizId
             ORDER BY 
                k.id`,
            [quizId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log("Adatbázis eredmény:", result.rows);

        const questions = structureQuestions(result.rows);

        console.log("Strukturált kérdések:", questions);

        res.render('kviz/start', {
            questions,
            quizId,
            roomId: roomId
        });

    } catch (err) {
        console.error('Hiba a kvíz kérdéseinek lekérdezésekor:', err);
        res.status(500).send('Szerverhiba történt.');
    }
};

function structureQuestions(rows) {
    const questions = [];
    let currentQuestion = null;

    console.log("Eredeti sorok:", rows);

    if (!rows || rows.length === 0) {
        console.log("Nincsenek sorok az adatbázis lekérdezésben!");
        return questions;
    }

    rows.forEach(row => {
        console.log("Feldolgozás alatt álló sor:", row);

        if (!currentQuestion || currentQuestion.id !== row.KERDES_ID) {
            currentQuestion = {
                id: row.KERDES_ID,
                szoveg: row.KERDES_SZOVEG,
                nehezsegiSzint: row.NEHEZSEGI_SZINT,
                idokorlat: row.IDOKORLAT,
                valaszok: []
            };
            questions.push(currentQuestion);
        }

        currentQuestion.valaszok.push({
            id: row.VALASZ_ID,
            szoveg: row.VALASZ_SZOVEG,
            helyes: row.HELYES
        });
    });

    console.log("Strukturált kérdések:", questions);
    return questions;
}

exports.submitQuiz = async (req, res) => {
    const { quizId, questions, jatekszobaId } = req.body;

    const token = req.cookies.token;

    const userId = await DbFunctions.verifyToken(token);

    if (!userId) {
        return res.status(401).send('Nincs bejelentkezve, vagy a munkamenet lejárt.');
    }

    try {
        const connection = getInstance();

        if (jatekszobaId) {
            const alreadySubmitted = await DbFunctions.checkFelhSzobaEredmeny(userId, jatekszobaId, quizId);
            if (alreadySubmitted) {
                console.log(`userID ${userId} már beadta kvízID ${quizId} kvízt a ${jatekszobaId} id-jű szobába.`);
                return res.redirect(`/jatekszoba/${jatekszobaId}?error=already_submitted`);
            }
        }

        let score = 0;
        let totalQuestions = questions ? questions.length : 0;
        const userAnswers = [];
        let totalTime = 0;
        let correctAnswers = 0;

        for (const question of questions) {
            const selectedAnswerId = question.selectedAnswer || null;
            const questionTime = question.answeredTime || 0;

            totalTime += parseInt(questionTime);

            let isCorrect = false;
            if (selectedAnswerId != null) {
                const result = await connection.execute(
                    `SELECT HELYES FROM VALASZ WHERE ID = :answerId`,
                    [selectedAnswerId],
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );

                if (result.rows && result.rows.length > 0) {
                    isCorrect = result.rows[0].HELYES === 1;

                    if (isCorrect) {
                        score++;
                        correctAnswers++;
                    }
                }
            }

            userAnswers.push({
                questionId: question.id,
                answerId: selectedAnswerId,
                isCorrect
            });
        }

        await connection.execute(
            `INSERT INTO EREDMENY (FELHASZNALO_ID, KVIZ_ID, PONTSZAM, IDOBELYEG, JATEKSZOBA_ID)
             VALUES (:userId, :quizId, :score, CURRENT_TIMESTAMP, :jatekszobaId)`,
            {
                userId: userId,
                quizId: quizId,
                score: score,
                jatekszobaId: jatekszobaId || null
            }
        );

        const statCheck = await connection.execute(
            `SELECT ID, ATLAGOS_KITOLTESI_IDO, HELYES_VALASZOK_ARANYA 
             FROM STATISZTIKA 
             WHERE FELHASZNALO_ID = :userId AND KVIZ_ID = :quizId`,
            {
                userId: userId,
                quizId: quizId
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const avgTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;
        const correctRatio = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;

        if (statCheck.rows.length > 0) {
            const existingStat = statCheck.rows[0];
            const oldAvgTime = parseFloat(existingStat.ÁTLAGOS_KITÖLTÉSI_IDŐ) || 0;
            const oldRatio = parseFloat(existingStat.HELYES_VÁLASZOK_ARÁNYA) || 0;

            const newAvgTime = (oldAvgTime + avgTime) / 2;
            const newRatio = (oldRatio + correctRatio) / 2;

            await connection.execute(
                `UPDATE STATISZTIKA 
                 SET ATLAGOS_KITOLTESI_IDO = :avgTime, 
                     HELYES_VALASZOK_ARANYA = :correctRatio 
                 WHERE ID = :statId`,
                {
                    avgTime: newAvgTime,
                    correctRatio: newRatio,
                    statId: existingStat.ID
                }
            );
        } else {
            await connection.execute(
                `INSERT INTO STATISZTIKA (FELHASZNALO_ID, KVIZ_ID, ATLAGOS_KITOLTESI_IDO, HELYES_VALASZOK_ARANYA)
                 VALUES (:userId, :quizId, :avgTime, :correctRatio)`,
                {
                    userId: userId,
                    quizId: quizId,
                    avgTime: avgTime,
                    correctRatio: correctRatio
                }
            );
        }

        const rankCheck = await connection.execute(
            `SELECT ID, OSSZPONTSZAM FROM RANGLISTA WHERE FELHASZNALO_ID = :userId`,
            { userId: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (rankCheck.rows.length > 0) {
            const currentScore = parseInt(rankCheck.rows[0].ÖSSZPONTSZÁM) || 0;
            const newTotalScore = currentScore + score;

            await connection.execute(
                `UPDATE RANGLISTA SET OSSZPONTSZAM = :newScore WHERE ID = :rankId`,
                {
                    newScore: newTotalScore,
                    rankId: rankCheck.rows[0].ID
                }
            );
        } else {
            await connection.execute(
                `INSERT INTO RANGLISTA (FELHASZNALO_ID, OSSZPONTSZAM)
                 VALUES (:userId, :score)`,
                {
                    userId: userId,
                    score: score
                }
            );
        }

        await connection.commit();

        const percentage = Math.round((score / totalQuestions) * 100);

        if (jatekszobaId) {
            res.redirect(`/jatekszoba/${jatekszobaId}?message=submitted`);
        } else {
            res.render('kviz/result', {
                score,
                totalQuestions,
                percentage,
                userAnswers,
                quizId
            });
        }

    } catch (err) {
        console.error('Hiba a kvíz kiértékelésekor:', err);
        res.status(500).send('Szerverhiba történt.');
    }
};