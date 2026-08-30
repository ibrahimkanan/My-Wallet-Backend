import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import morgan from "morgan";
import helmet from "helmet";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
    console.log("app health is working", Date.now());
});

app.get("/health/db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ status: "ok", db_time: result.rows[0].now });
    } catch (err) {
        console.error("DB connection error:", err.message);
        res.status(500).json({ status: "error", message: err.message });
    }
});

export default app;
