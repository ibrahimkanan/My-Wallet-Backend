import cron from "node-cron";
import { processAllDueRecurringTransactions } from "../repositories/recurringTransaction.repo.js";

export function startRecurringTransactionsJob() {
    cron.schedule("5 0 * * *", async () => {
        try {
            const count = await processAllDueRecurringTransactions();
            console.log(
                `[recurring-job] processed ${count} due transaction(s)`,
            );
        } catch (error) {
            console.error("[recurring-job] failed:", error);
        }
    });
}
