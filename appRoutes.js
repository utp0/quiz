const path = require("path");
const express = require("express");

const app = new express.Router();

app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
})

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



module.exports = app;