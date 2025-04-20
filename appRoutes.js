const path = require("path");
const express = require("express");

const app = new express.Router();

app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
})

app.get("/tema", (req, res) => {
    res.render("main", {
        page: "tema/list",
        title: "Témakörök"
    });
});

app.get("/register", (req, res) => {
    res.render("main", {
        page: "partial/register",  
        title: "Regisztráció",
    });
});

app.get("/login", (req, res) => {
    res.render("main", {
        page: "partial/login",  
        title: "Bejelentkezés",
    });
});

app.get("/tema", (req, res) => {
    // Majd ide jön az adatbázisból lekérés
    const temakorok = [
        { id: 1, nev: "Történelem" },
        { id: 2, nev: "Informatika" },
    ];

    res.render("main", {
        page: "tema/list",  // belső nézet
        title: "Témakörök",
        temakorok
    });
});

app.get("/tema/new", (req, res) => {
    res.render("main", {
        page: "tema/new",
        title: "Új témakör"
    });
});

app.get("/tema/:id/edit", (req, res) => {
    // Később adatbázisból lekérni az adott témakört
    const temakor = { id: req.params.id, nev: "Minta témakör" };

    res.render("main", {
        page: "tema/edit",
        title: "Témakör szerkesztése",
        temakor
    });
});



module.exports = app;