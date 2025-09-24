import { z } from 'zod';

// Base entity with common fields
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
  deleted: z.boolean().default(false),
  client_id: z.string().optional(),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;

// Settings
export const SettingsSchema = BaseEntitySchema.extend({
  currency_code: z.string().length(3).default('USD'),
  reveal_day: z.number().int().min(0).max(6).default(6), // 0=Sunday, 6=Saturday
  hide_balance: z.boolean().default(true),
  initial_balance_cents: z.number().int().default(0),
  timezone: z.string().optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

// Categories
export const CategorySchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(100),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

// Transaction types
export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer', 'adjustment']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

// Transactions
export const TransactionSchema = BaseEntitySchema.extend({
  amount_cents: z.number().int(),
  type: TransactionTypeSchema,
  category_id: z.string().uuid().optional(),
  goal_id: z.string().uuid().optional(),
  description: z.string().optional(),
  occurred_at: z.string().datetime(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Budget periods
export const BudgetPeriodSchema = z.enum(['weekly', 'monthly', 'custom']);
export type BudgetPeriod = z.infer<typeof BudgetPeriodSchema>;

// Budgets
export const BudgetSchema = BaseEntitySchema.extend({
  category_id: z.string().uuid(),
  period: BudgetPeriodSchema,
  period_start: z.string().date(),
  period_end: z.string().date(),
  allocated_cents: z.number().int().nonnegative(),
  carryover: z.boolean().default(false),
});

export type Budget = z.infer<typeof BudgetSchema>;

// Goals
export const GoalSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(100),
  target_cents: z.number().int().positive(),
  saved_cents: z.number().int().nonnegative().default(0),
  due_date: z.string().date().optional(),
});

export type Goal = z.infer<typeof GoalSchema>;

// API Request/Response types
export const SyncRequestSchema = z.object({
  client_id: z.string().uuid(),
  since: z.number().int().nonnegative(),
  push: z.object({
    settings: z.array(SettingsSchema).optional(),
    categories: z.array(CategorySchema).optional(),
    transactions: z.array(TransactionSchema).optional(),
    budgets: z.array(BudgetSchema).optional(),
    goals: z.array(GoalSchema).optional(),
  }),
});

export type SyncRequest = z.infer<typeof SyncRequestSchema>;

export const SyncResponseSchema = z.object({
  server_time: z.number().int().positive(),
  pull: z.object({
    settings: z.array(SettingsSchema).optional(),
    categories: z.array(CategorySchema).optional(),
    transactions: z.array(TransactionSchema).optional(),
    budgets: z.array(BudgetSchema).optional(),
    goals: z.array(GoalSchema).optional(),
  }),
});

export type SyncResponse = z.infer<typeof SyncResponseSchema>;

// Error response
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;