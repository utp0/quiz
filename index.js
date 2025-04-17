const { log } = require("console");
const express = require("express");
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;  // ezt használjuk böngészőben
const ANGULAR_DEV_SERVER_PORT = 4200;
const ANGULAR_DEV_SERVER_URL = `http://localhost:${ANGULAR_DEV_SERVER_PORT}`;

// teszt
app.get("/api/ping", (req, res) => {
    res.json({ message: "pong" });
})

app.use('/', createProxyMiddleware({
    target: ANGULAR_DEV_SERVER_URL,
    secure: false,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
}));

app.listen(PORT, () => {
    console.log(`Express: http://127.0.0.1:${PORT}/\n
        `);
})