const oracledb = require("oracledb");

// Oracledb beállítása
const _dbInstance = require("./dbInstance");
_dbInstance.openDB().then(async () => {
    console.log("Adatbázis kapcsolat létrejött!");
});

const fs = require("fs");
const path = require("path");
//jank{
try {
    const tokenPath = path.join(__dirname, (process.env.TOKENPATH || "./tokens.json"));
    if (!fs.existsSync(tokenPath)) {
        fs.writeFileSync(tokenPath, "[]", { encoding: "utf-8" });
        console.debug("\"Üres\" tokens.json fájl létrehozva.");
    }
} catch (error) {
    console.warn("\"Üres\" tokens.json fájl létrehozása nem sikerült.\n", error);
}
//}

const express = require("express");
const cookieparser = require("cookie-parser");
const methodOverride = require('method-override');

const app = express();

app.use(cookieparser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const PORT = process.env.PORT || 3000;  // ezt használjuk böngészőben

app.set("view engine", "ejs");
app.set("view options", {
    rmWhitespace: false,
    async: false,
});
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use(require("./appRoutes"));

app.listen(PORT, () => {
    console.log(`Express: http://127.0.0.1:${PORT}/\n`);
})