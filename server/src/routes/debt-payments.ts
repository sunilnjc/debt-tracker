import { Router } from 'express';
import { type DebtPayment, DebtModel, DebtPaymentModel, toEngine } from '../models';

// Mounted at /api/debts/:id/payments — mergeParams gives handlers req.params.id.
export const debtPaymentsRouter = Router({ mergeParams: true });

debtPaymentsRouter.get('/', async (req, res) => {
  const debtId = (req.params as Record<string, string>).id;
  const docs = await DebtPaymentModel.find({ debtId }).sort({ date: 1 }).lean();
  res.json(docs.map((d) => toEngine<DebtPayment>(d as any)));
});

// Logging a payment records history AND decrements the balance in one flow —
// the primary way to record a real payment (inline balance editing remains
// available for corrections).
debtPaymentsRouter.post('/', async (req, res) => {
  try {
    const debtId = (req.params as Record<string, string>).id;
    const { amount, date, note } = req.body ?? {};
    if (typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'amount must be a positive number' });
      return;
    }

    const debt = await DebtModel.findById(debtId);
    if (!debt) {
      res.status(404).json({ error: 'debt not found' });
      return;
    }
    if (amount > debt.currentBalance) {
      res.status(400).json({ error: `amount (${amount}) exceeds current balance (${debt.currentBalance})` });
      return;
    }

    const payment = await DebtPaymentModel.create({ debtId, amount, date, note });
    debt.currentBalance -= amount;
    await debt.save();

    res.status(201).json(toEngine<DebtPayment>(payment.toObject() as any));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
