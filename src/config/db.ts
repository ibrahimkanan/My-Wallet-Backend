import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const {Pool} = pg;

pg.types.setTypeParser(1082, (val) => val);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
    console.log("Connected to Neon");
});
pool.on("error", (err:Error) => {
    console.error("Unexpected error on idle client", err);
    process.exit(1);
});

export default pool;
