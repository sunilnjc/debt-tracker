import { Router } from 'express';
import type { Model } from 'mongoose';
import { toEngine } from '../models';

/** Generic REST CRUD over a mongoose model whose `_id` is the engine's string `id`. */
export function crudRouter<T extends { id: string }>(model: Model<any>): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    const docs = await model.find().lean();
    res.json(docs.map((d) => toEngine<T>(d as any)));
  });

  // If the caller supplies an id (Phase 1 models use stable ids like "salary"),
  // it becomes _id. Otherwise Mongo assigns an ObjectId (e.g. Expense).
  router.post('/', async (req, res) => {
    try {
      const { id, ...rest } = req.body ?? {};
      const doc = await model.create(id ? { _id: id, ...rest } : rest);
      res.status(201).json(toEngine<T>(doc.toObject() as any));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { id: _ignored, ...rest } = req.body ?? {};
      const doc = await model.findByIdAndUpdate(req.params.id, rest, {
        new: true,
        runValidators: true,
      });
      if (!doc) {
        res.status(404).json({ error: 'not found' });
        return;
      }
      res.json(toEngine<T>(doc.toObject() as any));
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.delete('/:id', async (req, res) => {
    const doc = await model.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    res.status(204).end();
  });

  return router;
}
