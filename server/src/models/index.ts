import { Schema, model } from 'mongoose';
import { isValidMonth } from '../engine/month';
import type { Debt, Deferment, OneTimeEvent, RecurringItem } from '../engine/types';

/**
 * Documents store the engine's `id` as `_id`; everything else matches
 * engine/types.ts one-to-one. `toEngine` converts back.
 */
type WithMongoId<T extends { id: string }> = Omit<T, 'id'> & { _id: string };

export function toEngine<T extends { id: string }>(doc: WithMongoId<T>): T {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as unknown as T;
}

const month = {
  type: String,
  validate: { validator: isValidMonth, message: 'must be YYYY-MM' },
};

const recurringItemSchema = new Schema<WithMongoId<RecurringItem>>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ['income', 'loan_emi', 'fixed_cost'], required: true },
    frequency: { type: String, enum: ['monthly'], default: 'monthly' },
    startMonth: { ...month, required: true },
    endMonth: {
      type: String,
      default: null,
      validate: { validator: (v: string | null) => v === null || isValidMonth(v), message: 'must be YYYY-MM' },
    },
    notes: String,
  },
  { versionKey: false },
);

const oneTimeEventSchema = new Schema<WithMongoId<OneTimeEvent>>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    month: { ...month, required: true },
    kind: { type: String, enum: ['rent_cheque', 'other'], default: 'other' },
    status: { type: String, enum: ['planned', 'done', 'cancelled'], default: 'planned' },
  },
  { versionKey: false },
);

const debtSchema = new Schema<WithMongoId<Debt>>(
  {
    _id: { type: String, required: true },
    creditor: { type: String, required: true },
    originalAmount: { type: Number, required: true, min: 0 },
    currentBalance: { type: Number, required: true, min: 0 },
    priority: { type: Number, required: true, min: 1, validate: { validator: Number.isInteger, message: 'must be an integer' } },
    currency: { type: String, enum: ['AED', 'INR'], default: 'AED' },
    fxRate: { type: Number, default: null, min: 0 },
    notes: String,
  },
  { versionKey: false },
);

const defermentSchema = new Schema<WithMongoId<Deferment>>(
  {
    _id: { type: String, required: true },
    targetItemId: { type: String, required: true },
    month: { ...month, required: true },
    fee: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['planned', 'confirmed', 'used'], default: 'planned' },
  },
  { versionKey: false },
);

export const RecurringItemModel = model('RecurringItem', recurringItemSchema);
export const OneTimeEventModel = model('OneTimeEvent', oneTimeEventSchema);
export const DebtModel = model('Debt', debtSchema);
export const DefermentModel = model('Deferment', defermentSchema);
