import { Router } from 'express';
import { checkDefermentRule } from '../engine/deferments';
import { isValidMonth } from '../engine/month';
import type { Deferment } from '../engine/types';
import { DefermentModel, toEngine } from '../models';
import { crudRouter } from './crud';

export const defermentsRouter = Router();

defermentsRouter.post('/', async (req, res) => {
  try {
    const { id, targetItemId, month, fee, status } = req.body ?? {};
    if (!targetItemId || !month || !isValidMonth(month)) {
      res.status(400).json({ error: 'targetItemId and month (YYYY-MM) are required' });
      return;
    }

    const existingDocs = await DefermentModel.find({ targetItemId }).lean();
    const existing = existingDocs.map((d) => toEngine<Deferment>(d as any));

    const violation = checkDefermentRule({ targetItemId, month }, existing);
    if (violation) {
      res.status(400).json({ error: violation });
      return;
    }

    const doc = await DefermentModel.create(
      id ? { _id: id, targetItemId, month, fee, status } : { targetItemId, month, fee, status },
    );
    res.status(201).json(toEngine<Deferment>(doc.toObject() as any));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

defermentsRouter.use('/', crudRouter<Deferment>(DefermentModel));
