const express = require("express");
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;  // ezt használjuk böngészőben

app.set("view engine", "ejs");
app.set("view options", {
    rmWhitespace: true,
    async: false,
});
app.set("views", path.join(__dirname, "views"));

// teszt
app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
})

app.get("/register", (req, res) => {
    res.render("main", {
        page: "partial/register",
        title: "Regisztráció",
    });
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
    console.log(`Express: http://127.0.0.1:${PORT}/\n
        `);
})