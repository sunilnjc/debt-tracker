import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { connectDb } from './db';
import { DebtModel, OneTimeEventModel, RecurringItemModel } from './models';
import { crudRouter } from './routes/crud';
import { debtPaymentsRouter } from './routes/debt-payments';
import { defermentsRouter } from './routes/deferments';
import { exportRouter } from './routes/export';
import { expensesRouter } from './routes/expenses';
import { monthCloseRouter } from './routes/month-close';
import { projectionRouter } from './routes/projection';
import { savingsRouter } from './routes/savings';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'budgettracker-server' });
});

app.use('/api/recurring-items', crudRouter(RecurringItemModel));
app.use('/api/one-time-events', crudRouter(OneTimeEventModel));
app.use('/api/debts', crudRouter(DebtModel));
app.use('/api/debts/:id/payments', debtPaymentsRouter);
app.use('/api/deferments', defermentsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/month-close', monthCloseRouter);
app.use('/api/projection', projectionRouter);
app.use('/api/savings', savingsRouter);
app.use('/api/export', exportRouter);

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
