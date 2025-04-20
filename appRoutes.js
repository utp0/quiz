const path = require("path");
const express = require("express");

const app = new express.Router();

const { registerUser, loginToken, verifyToken } = require("./dbFunctions");

app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
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
        res.json({message: "Valamelyik mező hibás. Próbáld újra!"});
        return;
    }

    try {
        await registerUser(username, email, pass, birthyear);
        res.redirect("/login");
    } catch (error) {
        res.json({message: "A regisztráció sikertelen!"});
    }
});

app.get("/login", (req, res) => {
    res.render("main", {
        page: "partial/login",
        title: "Bejelentkezés",
    });
});

app.post("/login", (req, res) => {
    const username = req.body["usernameOrEmail"];
    const pass = req.body["password"];

    loginToken(username, pass);
    res.end();
})



module.exports = app;