const oracledb = require("oracledb");

// Oracledb beállítása
const _dbInstance = require("./dbInstance");
_dbInstance.openDB().then(async () => {
    console.log("Adatbázis kapcsolat létrejött!");
});

const express = require("express");
const cookieparser = require("cookie-parser");
const path = require('path');

const app = express();

app.use(cookieparser());
app.use(express.json());
app.use(express.urlencoded());

const PORT = process.env.PORT || 3000;  // ezt használjuk böngészőben

app.set("view engine", "ejs");
app.set("view options", {
    rmWhitespace: true,
    async: false,
});
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(require("./appRoutes"));

app.listen(PORT, () => {
    console.log(`Express: http://127.0.0.1:${PORT}/\n`);
})