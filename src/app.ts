import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import pool from "./config/db.js";

// routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import budgetRoutes from "./routes/budgets.routes.js";
import chartRoutes from "./routes/chart.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok" });
});

app.get("/health/db", async (req: Request, res: Response) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ status: "ok", db_time: result.rows[0].now });
    } catch (err) {
        console.error("DB connection error:", (err as Error).message);
        res.status(500).json({
            status: "error",
            message: (err as Error).message,
        });
    }
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/wallets", walletRoutes);
app.use("/categories", categoryRoutes);
app.use("/transactions", transactionRoutes);
app.use("/budgets", budgetRoutes);
app.use("/charts", chartRoutes);

export default app;
