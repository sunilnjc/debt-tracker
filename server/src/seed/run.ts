/**
 * Wipes and reloads the four collections from engine/seed-data.ts.
 * Idempotent — safe to re-run: `npm run seed`.
 */
import { connectDb, disconnectDb } from '../db';
import { DebtModel, DefermentModel, OneTimeEventModel, RecurringItemModel } from '../models';
import { debts, deferments, oneTimeEvents, recurringItems } from '../engine/seed-data';

function toDoc<T extends { id: string }>({ id, ...rest }: T) {
  return { _id: id, ...rest };
}

async function seed(): Promise<void> {
  await connectDb();

  await Promise.all([
    RecurringItemModel.deleteMany({}),
    OneTimeEventModel.deleteMany({}),
    DebtModel.deleteMany({}),
    DefermentModel.deleteMany({}),
  ]);

  await RecurringItemModel.insertMany(recurringItems.map(toDoc));
  await OneTimeEventModel.insertMany(oneTimeEvents.map(toDoc));
  await DebtModel.insertMany(debts.map(toDoc));
  await DefermentModel.insertMany(deferments.map(toDoc));

  console.log(
    `Seeded: ${recurringItems.length} recurring items, ${oneTimeEvents.length} one-time events, ` +
      `${debts.length} debts, ${deferments.length} deferments.`,
  );

  await disconnectDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
