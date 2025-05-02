const path = require("path");
const express = require("express");
const methodOverride = require('method-override');
const quizController = require('./controllers/quizController');


/**
 * @type {express.Router}
 */
const app = new express.Router();

const { registerUser, loginToken, verifyToken, getUserById, getAllTemakor, createTemakor, getTekorById, updateTemakor, deleteTemakor, deleteToken, getAllKerdes, createKerdes, getKerdesById, updateKerdes, deleteKerdes, getAllKviz, getKvizById, createKviz, updateKviz, deleteKviz, getAllJatekszoba, createJatekszoba, deleteJatekszoba } = require("./dbFunctions");
const DbFunctions = require("./dbFunctions");

app.use(async (req, res, next) => {
    const tokenCookie = req.cookies["token"] ?? null;
    if (tokenCookie !== null) {
        const userId = await verifyToken(tokenCookie);
        let user = await getUserById(userId);
        if (user == null) {
            // töröljük a sütit ha amúgy is invalid
            res.clearCookie("token");
        } else {
            user["JELSZO"] = "";
            res.locals.currentUser = user;
        }
    }
    next()
})


function isAdmin(req, res, next) {
    if (typeof res.locals.currentUser !== "undefined" && res.locals.currentUser && res.locals.currentUser["JOGOSULTSAG"] === "admin") {
        return next();
    }
    return res.status(400).json({ message: "Ehhez nincs engedélyed!" });
}

app.use(methodOverride('_method'));

app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
})

app.get("/", (req, res) => {
    res.render("main", {
        page: "partial/homepage",
        title: "Kezdőlap",
    });
})

app.get("/register", (req, res) => {
    res.render("main", {
        page: "partial/register",
        title: "Regisztráció",
    });
});

app.post("/register", async (req, res) => {
    const username = req.body["username"];
    const email = req.body["email"];
    const pass = req.body["password"];
    const pass2 = req.body["confirmPassword"];
    const birthyear = req.body["birthYear"];

    if (username.trim().length < 1 ||
        email.trim().length < 5 ||
        pass.length < 3 ||
        pass !== pass2 ||
        birthyear.toString().trim().length < 4
    ) {
        res.json({ message: "Valamelyik mező hibás. Próbáld újra!" });
        return;
    }

    try {
        await registerUser(username, email, pass, birthyear);
        res.redirect("/login");
    } catch (error) {
        res.json({ message: "A regisztráció sikertelen!" });
    }
});

app.get("/login", (req, res) => {
    res.render("main", {
        page: "partial/login",
        title: "Bejelentkezés",
    });
});

app.all("/logout", (req, res) => {
    deleteToken(req.cookies["token"] ?? null);
    res.clearCookie("token");
    res.redirect("/");
})

app.post("/login", async (req, res) => {
    const username = req.body["usernameOrEmail"];
    const pass = req.body["password"];

    const obj = await loginToken(username, pass);
    const strToken = obj != null ? obj.token ?? null : null;
    if (obj == null || obj.token == null) {
        res.clearCookie("token");
        return res.status(400).json({ "message": "Ez a név/jelszó kombináció nem létezik!" });
    }
    res.cookie("token", strToken ?? "");
    return res.redirect("/");
});

app.get("/profile", async (req, res) => {
    const stats = await DbFunctions.getStatsForUser(res.locals.currentUser["ID"]);
    let quizes = [];

    for (const element of stats) {
        try {
            const quiz = await getKvizById(element["KVIZ_ID"]);
            quizes.push(quiz);
        } catch (error) {
            console.error(`Kvíz lekérése sikertelen! id: ${element["KVIZ_ID"]}`);
            quizes.push({});
        }
    }

    return res.render("main",
        {
            page: "partial/profile",
            title: "Profil",
            stats: stats,
            quizes: quizes,
        }
    );
});

app.get("/kviz/start/:id", quizController.startQuiz);

app.post('/kviz/submit', quizController.submitQuiz);

app.get("/tema", async (req, res) => {
    try {
        const temakorok = await getAllTemakor();

        res.render("main", {
            page: "tema/list",
            title: "Témakörök",
            temakorok: temakorok
        });
    } catch (error) {
        console.error("Hiba a témakörök lekérdezésénél:", error);
        res.status(500).send("Hiba történt a témakörök lekérdezésénél.");
    }
});

app.get("/tema/new", isAdmin, (req, res) => {

    res.render("main", {
        page: "tema/new",
        title: "Új témakör"
    });
});

app.post("/tema", isAdmin, async (req, res) => {

    const nev = req.body.nev?.trim();

    if (!nev || nev.length === 0) {
        return res.render("main", {
            page: "tema/new",
            title: "Új témakör",
            error: "A témakör neve nem lehet üres!"
        });
    }

    try {
        await createTemakor(nev);
        res.redirect("/tema");
    } catch (error) {
        res.render("main", {
            page: "tema/new",
            title: "Új témakör",
            error: error.message || "Hiba történt a témakör létrehozásakor."
        });
    }
});

const statisticsController = require('./controllers/statisticsController');

app.get('/ranglista', statisticsController.showRankings);

// Felhasználói statisztikák
app.get('/statisztika/felhasznalo', statisticsController.showUserStatistics);

// Kvíz statisztikák
app.get('/statisztika/kviz/:id', statisticsController.showQuizStatistics);

// Globális statisztikák
app.get('/statisztika/globalis', statisticsController.showGlobalStatistics);

app.get("/tema/:id/edit", isAdmin, async (req, res) => {

    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send("Érvénytelen témakör azonosító");
        }

        const temakor = await getTekorById(id);
        if (!temakor) {
            return res.status(404).send("A témakör nem található");
        }

        res.render("main", {
            page: "tema/edit",
            title: "Témakör szerkesztése",
            temakor: temakor
        });
    } catch (error) {
        console.error("Hiba a témakör betöltésekor:", error);
        res.status(500).send("Hiba történt a témakör betöltésekor.");
    }
});

app.post("/tema/:id", isAdmin, async (req, res) => {

    if (req.body._method === "PUT") {
        const nev = req.body.nev?.trim();
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).send("Érvénytelen témakör azonosító");
        }

        if (!nev || nev.length === 0) {
            const temakor = await getTekorById(id);
            return res.render("main", {
                page: "tema/edit",
                title: "Témakör szerkesztése",
                temakor: temakor,
                error: "A témakör neve nem lehet üres!"
            });
        }

        try {
            await updateTemakor(id, nev);
            res.redirect("/tema");
        } catch (error) {
            const temakor = await getTekorById(id);
            res.render("main", {
                page: "tema/edit",
                title: "Témakör szerkesztése",
                temakor: temakor,
                error: error.message || "Hiba történt a témakör frissítésekor."
            });
        }
    }
    else if (req.body._method === "DELETE") {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).send("Érvénytelen témakör azonosító");
        }

        try {
            await deleteTemakor(id);
            res.redirect("/tema");
        } catch (error) {
            console.error("Hiba a témakör törlésekor:", error);
            res.status(500).send("Hiba történt a témakör törlésekor: " + (error.message || "Ismeretlen hiba"));
        }
    }
    else {
        res.status(400).send("Ismeretlen metódus");
    }
});

app.get("/kviz", async (req, res) => {
    try {
        const kvizek = await getAllKviz();

        res.render("main", {
            page: "kviz/kvizlist",
            title: "Kvízek",
            kvizek: kvizek
        });
    } catch (error) {
        console.error("Hiba a kvízek lekérdezésénél:", error);
        res.status(500).send("Hiba történt a kvízek lekérdezésénél.");
    }
});

app.get("/kviz/new", isAdmin, (req, res) => {
    if (!res.locals.currentUser) {
        return res.redirect("/login");
    }

    res.render("main", {
        page: "kviz/kviznew",
        title: "Új kvíz"
    });
});

app.get("/kviz/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
        return res.status(400).send("Érvénytelen kvíz azonosító");
    }

    try {
        const kviz = await getKvizById(id);

        if (!kviz) {
            return res.status(404).send("A kvíz nem található");
        }

        res.render("main", {
            page: "kviz/details",
            title: `Kvíz: ${kviz.nev}`,
            kviz: kviz
        });
    } catch (error) {
        console.error("Hiba a kvíz betöltésekor:", error);
        res.status(500).send("Hiba történt a kvíz betöltésekor.");
    }
});



app.post("/kviz", async (req, res) => {
    if (!res.locals.currentUser) {
        return res.redirect("/login");
    }

    const nev = req.body.nev?.trim();
    const leiras = req.body.leiras?.trim() || "";

    if (!nev || nev.length === 0) {
        return res.render("main", {
            page: "kviz/kviznew",
            title: "Új kvíz",
            error: "A kvíz neve nem lehet üres!"
        });
    }

    try {
        await createKviz(nev, leiras, res.locals.currentUser.ID);
        res.redirect("/kviz");
    } catch (error) {
        console.error("Hiba a kvíz létrehozásánál:", error);
        res.render("main", {
            page: "kviz/kviznew",
            title: "Új kvíz",
            error: "Hiba történt a kvíz létrehozásakor."
        });
    }
});

app.get("/kviz/:id/edit", isAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Érvénytelen kvíz azonosító");

    try {
        const kviz = await DbFunctions.getKvizById(id);
        if (!kviz) return res.status(404).send("A kvíz nem található");

        res.render("main", {
            page: "kviz/kvizedit",
            title: "Kvíz szerkesztése",
            kviz
        });
    } catch (error) {
        console.error("Hiba a kvíz szerkesztésnél:", error);
        res.status(500).send("Hiba történt a kvíz betöltésekor.");
    }
});

app.post("/kviz/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Érvénytelen kvíz azonosító");

    if (req.body._method === "PUT") {
        const nev = req.body.nev?.trim();
        const leiras = req.body.leiras?.trim();

        if (!nev) {
            const kviz = await DbFunctions.getKvizById(id);
            return res.render("main", {
                page: "kviz/kvizedit",
                title: "Kvíz szerkesztése",
                kviz,
                error: "A kvíz neve nem lehet üres!"
            });
        }

        try {
            await DbFunctions.updateKviz(id, nev, leiras);
            res.redirect("/kviz");
        } catch (error) {
            const kviz = await DbFunctions.getKvizById(id);
            res.render("main", {
                page: "kviz/kvizedit",
                title: "Kvíz szerkesztése",
                kviz,
                error: error.message || "Hiba történt a frissítés során."
            });
        }
    } else if (req.body._method === "DELETE") {
        try {
            await DbFunctions.deleteKviz(id);
            res.redirect("/kviz");
        } catch (error) {
            console.error("Hiba a törlésnél:", error);
            res.status(500).send("Hiba történt a törlés során.");
        }
    } else {
        res.status(400).send("Ismeretlen metódus.");
    }
});


app.get("/kerdes", async (req, res) => {
    try {
        const kerdesek = await getAllKerdes();

        res.render("main", {
            page: "kerdes/list",
            title: "Kérdések",
            kerdesek: kerdesek
        });
    } catch (error) {
        console.error("Hiba a kérdések lekérdezésénél:", error);
        res.status(500).send("Hiba történt a témakörök lekérdezésénél.");
    }
});

app.get("/kerdes/new", isAdmin, (req, res) => {

    res.render("main", {
        page: "kerdes/new",
        title: "Új kérdés"
    });
});


app.post("/kerdes", isAdmin, async (req, res) => {

    const nev = req.body.nev?.trim();

    if (!nev || nev.length === 0) {
        return res.render("main", {
            page: "kerdes/new",
            title: "Új kérdés",
            error: "A kérdés szövege nem lehet üres!"
        });
    }

    try {
        await createKerdes(nev);
        res.redirect("/kerdes");
    } catch (error) {
        res.render("main", {
            page: "kerdes/list",
            title: "Új kérdés",
            error: error.message || "Hiba történt a kérdés létrehozásakor."
        });
    }
});

app.get("/kerdes/:id/edit", isAdmin, async (req, res) => {

    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send("Érvénytelen kérdés azonosító");
        }

        const kerdes = await getKerdesById(id);
        if (!kerdes) {
            return res.status(404).send("A kérdés nem található");
        }

        res.render("main", {
            page: "kerdes/edit",
            title: "Kérdés szerkesztése",
            kerdes: kerdes
        });
    } catch (error) {
        console.error("Hiba a kérdés betöltésekor:", error);
        res.status(500).send("Hiba történt a kérdés betöltésekor.");
    }
});

app.post("/kerdes/:id", isAdmin, async (req, res) => {

    if (req.body._method === "PUT") {
        const nev = req.body.nev?.trim();
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).send("Érvénytelen kérdés azonosító");
        }

        if (!nev || nev.length === 0) {
            const kerdes = await getKerdesById(id);
            return res.render("main", {
                page: "kerdes/edit",
                title: "Kérdés szerkesztése",
                kerdes: kerdes,
                error: "A kérdés neve nem lehet üres!"
            });
        }

        try {
            await updateKerdes(id, nev);
            res.redirect("/kerdes");
        } catch (error) {
            const kerdes = await getKerdesById(id);
            res.render("main", {
                page: "kerdes/edit",
                title: "Kérdés szerkesztése",
                kerdes: kerdes,
                error: error.message || "Hiba történt a kérdés frissítésekor."
            });
        }
    }
    else if (req.body._method === "DELETE") {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).send("Érvénytelen kérdés azonosító");
        }

        try {
            await deleteKerdes(id);
            res.redirect("/kerdes");
        } catch (error) {
            console.error("Hiba a kérdés törlésekor:", error);
            res.status(500).send("Hiba történt a kérdés törlésekor: " + (error.message || "Ismeretlen hiba"));
        }
    }
    else {
        res.status(400).send("Ismeretlen metódus");
    }
});

app.get("/jatekszoba", async (req, res) => {
    try {
        const szobak = await getAllJatekszoba();
        res.render("main", {
            page: "jatekszoba/list",
            title: "Játékszobák",
            jatekszobak: szobak
        });
    } catch (err) {
        console.error("Hiba a játékszobák lekérdezésekor:", err);
        res.status(500).send("Hiba történt a játékszobák lekérdezésekor.");
    }
});

app.get("/jatekszoba/new", (req, res) => {
    if (!res.locals.currentUser) {
        return res.redirect("/login");
    }

    res.render("main", {
        page: "jatekszoba/new",
        title: "Új játékszoba létrehozása"
    });
});

app.post("/jatekszoba/new", async (req, res) => {
    if (!res.locals.currentUser) {
        return res.redirect("/login");
    }

    const nev = req.body.nev?.trim();
    const maxJatekos = parseInt(req.body.max_jatekos);
    const felhasznalo_id = res.locals.currentUser["ID"];

    if (!felhasznalo_id) {
        return res.status(400).send("Hiányzik a felhasználó azonosító!");
    }

    if (!nev || isNaN(maxJatekos) || maxJatekos < 2) {
        return res.render("main", {
            page: "jatekszoba/new",
            title: "Új játékszoba létrehozása",
            error: "Hibás név vagy játékos szám! Minimum 2 fő szükséges."
        });
    }

    try {
        await createJatekszoba(nev, felhasznalo_id, maxJatekos);
        res.redirect("/jatekszoba");
    } catch (err) {
        console.error("Játékszoba létrehozása nem sikerült: ", err);
        res.render("main", {
            page: "jatekszoba/new",
            title: "Új játékszoba létrehozása",
            error: err.message || "Hiba történt a játékszoba létrehozásakor."
        });
    }
});

app.delete("/jatekszoba/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).send("Érvénytelen játékszoba azonosító");
    }

    try {
        await deleteJatekszoba(id);  // deleteJatekszoba törlési funkció
        res.redirect("/jatekszoba");
    } catch (err) {
        console.error("Hiba a játékszoba törlésekor:", err);
        res.status(500).send("Hiba történt a játékszoba törlésekor: " + (err.message || "Ismeretlen hiba"));
    }
});

app.post("/jatekszoba/:id", async (req, res) => {
    if (req.body._method === "DELETE") {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send("Érvénytelen játékszoba azonosító");
        }

        try {
            await deleteJatekszoba(id);
            res.redirect("/jatekszoba");
        } catch (err) {
            console.error("Hiba a játékszoba törlésekor:", err);
            res.status(500).send("Hiba történt a játékszoba törlésekor: " + (err.message || "Ismeretlen hiba"));
        }
    } else {
        res.status(400).send("Ismeretlen metódus");
    }
});




module.exports = app;