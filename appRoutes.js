const path = require("path");
const express = require("express");

const app = new express.Router();

app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
})

app.get("/", (req, res) => {
    res.render("main", {
        page: "partial/homepage",  // ez lenne pl "kerdessor" vagy "quizlista", amik pl a views/partial mappában lennének
        title: "Quiz - Főoldal",
        tesztvaltozo: "értékátadás ok"
    });
});

app.use(express.static(path.join(__dirname, "public")));

module.exports = app;