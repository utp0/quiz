const express = require("express");
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const path = require('path');
const oracledb = require("oracledb");

// Oracledb beállítása
const _dbInstance = require("./dbInstance");
_dbInstance.openDB().then(async () => {
    console.log("Adatbázis kapcsolat létrejött!");
    process.addListener("SIGINT", () => {
        _dbInstance.getInstance().close().catch(() => { });
    })
});


const app = express();

const PORT = process.env.PORT || 3000;  // ezt használjuk böngészőben

app.set("view engine", "ejs");
app.set("view options", {
    rmWhitespace: true,
    async: false,
});
app.set("views", path.join(__dirname, "views"));

app.use(require("./appRoutes"));

app.listen(PORT, () => {
    console.log(`Express: http://127.0.0.1:${PORT}/\n`);
})