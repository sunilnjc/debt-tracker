import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { connectDb } from './db';
import { DebtModel, DefermentModel, OneTimeEventModel, RecurringItemModel } from './models';
import { crudRouter } from './routes/crud';
import { expensesRouter } from './routes/expenses';
import { projectionRouter } from './routes/projection';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'budgettracker-server' });
});

app.use('/api/recurring-items', crudRouter(RecurringItemModel));
app.use('/api/one-time-events', crudRouter(OneTimeEventModel));
app.use('/api/debts', crudRouter(DebtModel));
app.use('/api/deferments', crudRouter(DefermentModel));
app.use('/api/expenses', expensesRouter);
app.use('/api/projection', projectionRouter);

const port = Number(process.env.PORT) || 4000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`budgettracker-server listening on :${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
