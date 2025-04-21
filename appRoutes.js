const path = require("path");
const express = require("express");
const methodOverride = require('method-override');


/**
 * @type {express.Router}
 */
const app = new express.Router();

const { registerUser, loginToken, verifyToken, getUserById, getAllTemakor, createTemakor, getTekorById, updateTemakor, deleteTemakor, deleteToken } = require("./dbFunctions");

app.use(async (req, res, next) => {
    const tokenCookie = req.cookies["token"] ?? null;
    const userId = await verifyToken(tokenCookie);
    let user = await getUserById(userId);
    if (user != null) {
        user["JELSZO"] = "";
        res.locals.currentUser = user;
    }
    next()
})

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

    const strToken = (await loginToken(username, pass)).token;
    res.cookie("token", strToken ?? "");
    res.redirect("/");
});

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

app.get("/tema/new", (req, res) => {
    res.render("main", {
        page: "tema/new",
        title: "Új témakör"
    });
});

app.post("/tema", async (req, res) => {
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

app.get("/tema/:id/edit", async (req, res) => {
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

app.post("/tema/:id", async (req, res) => {
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


module.exports = app;