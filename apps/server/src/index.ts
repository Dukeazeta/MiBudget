import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';

import { db } from '@mibudget/db';
import {
  SettingsSchema,
  CategorySchema,
  TransactionSchema,
  BudgetSchema,
  GoalSchema,
  SyncRequestSchema,
  generateId,
  now,
} from '@mibudget/shared';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];

// Initialize logger
const logger = pino({
  level: NODE_ENV === 'development' ? 'debug' : 'info',
  transport: NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined,
});

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
if (NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use(limiter);
}

// CORS
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use(pinoHttp({ logger }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

// Settings endpoints
app.get('/api/settings', async (_req, res) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (error) {
    logger.error('Error getting settings:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to get settings' 
    });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const settingsData = SettingsSchema.partial().parse(req.body);
    const updatedSettings = await db.updateSettings(settingsData);
    res.json(updatedSettings);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid settings data',
        details: error.errors,
      });
    }
    logger.error('Error updating settings:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to update settings' 
    });
  }
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const since = req.query.since ? parseInt(req.query.since as string, 10) : undefined;
    const categories = await db.getCategories(since);
    res.json(categories);
  } catch (error) {
    logger.error('Error getting categories:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to get categories' 
    });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      id: req.body.id || generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
    };
    
    const category = CategorySchema.parse(categoryData);
    const createdCategory = await db.createCategory(category);
    res.status(201).json(createdCategory);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid category data',
        details: error.errors,
      });
    }
    logger.error('Error creating category:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to create category' 
    });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = CategorySchema.partial().parse(req.body);
    const updatedCategory = await db.updateCategory(id, updates);
    
    if (!updatedCategory) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Category not found',
      });
    }
    
    res.json(updatedCategory);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid category data',
        details: error.errors,
      });
    }
    logger.error('Error updating category:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to update category' 
    });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteCategory(id);
    
    if (!success) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Category not found',
      });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to delete category' 
    });
  }
});

// Transactions endpoints
app.get('/api/transactions', async (req, res) => {
  try {
    const filters = {
      since: req.query.since ? parseInt(req.query.since as string, 10) : undefined,
      category_id: req.query.category_id as string,
      goal_id: req.query.goal_id as string,
      from: req.query.from as string,
      to: req.query.to as string,
    };
    
    const transactions = await db.getTransactions(filters);
    res.json(transactions);
  } catch (error) {
    logger.error('Error getting transactions:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to get transactions' 
    });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      id: req.body.id || generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
      occurred_at: req.body.occurred_at || new Date().toISOString(),
    };
    
    const transaction = TransactionSchema.parse(transactionData);
    const createdTransaction = await db.createTransaction(transaction);
    res.status(201).json(createdTransaction);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid transaction data',
        details: error.errors,
      });
    }
    logger.error('Error creating transaction:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to create transaction' 
    });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = TransactionSchema.partial().parse(req.body);
    const updatedTransaction = await db.updateTransaction(id, updates);
    
    if (!updatedTransaction) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Transaction not found',
      });
    }
    
    res.json(updatedTransaction);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid transaction data',
        details: error.errors,
      });
    }
    logger.error('Error updating transaction:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to update transaction' 
    });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteTransaction(id);
    
    if (!success) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Transaction not found',
      });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting transaction:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to delete transaction' 
    });
  }
});

// Budgets endpoints
app.get('/api/budgets', async (req, res) => {
  try {
    const since = req.query.since ? parseInt(req.query.since as string, 10) : undefined;
    const budgets = await db.getBudgets(since);
    res.json(budgets);
  } catch (error) {
    logger.error('Error getting budgets:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to get budgets' 
    });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const budgetData = {
      ...req.body,
      id: req.body.id || generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
    };
    
    const budget = BudgetSchema.parse(budgetData);
    const createdBudget = await db.createBudget(budget);
    res.status(201).json(createdBudget);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid budget data',
        details: error.errors,
      });
    }
    logger.error('Error creating budget:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to create budget' 
    });
  }
});

app.put('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = BudgetSchema.partial().parse(req.body);
    const updatedBudget = await db.updateBudget(id, updates);
    
    if (!updatedBudget) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Budget not found',
      });
    }
    
    res.json(updatedBudget);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid budget data',
        details: error.errors,
      });
    }
    logger.error('Error updating budget:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to update budget' 
    });
  }
});

app.delete('/api/budgets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteBudget(id);
    
    if (!success) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Budget not found',
      });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting budget:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to delete budget' 
    });
  }
});

// Goals endpoints
app.get('/api/goals', async (req, res) => {
  try {
    const since = req.query.since ? parseInt(req.query.since as string, 10) : undefined;
    const goals = await db.getGoals(since);
    res.json(goals);
  } catch (error) {
    logger.error('Error getting goals:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to get goals' 
    });
  }
});

app.post('/api/goals', async (req, res) => {
  try {
    const goalData = {
      ...req.body,
      id: req.body.id || generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
    };
    
    const goal = GoalSchema.parse(goalData);
    const createdGoal = await db.createGoal(goal);
    res.status(201).json(createdGoal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid goal data',
        details: error.errors,
      });
    }
    logger.error('Error creating goal:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to create goal' 
    });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = GoalSchema.partial().parse(req.body);
    const updatedGoal = await db.updateGoal(id, updates);
    
    if (!updatedGoal) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Goal not found',
      });
    }
    
    res.json(updatedGoal);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid goal data',
        details: error.errors,
      });
    }
    logger.error('Error updating goal:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to update goal' 
    });
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await db.deleteGoal(id);
    
    if (!success) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Goal not found',
      });
    }
    
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting goal:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Failed to delete goal' 
    });
  }
});

// Sync endpoint
app.post('/api/sync', async (req, res) => {
  try {
    const syncRequest = SyncRequestSchema.parse(req.body);
    const { client_id, since, push } = syncRequest;
    
    logger.info(`Sync request from client ${client_id}, since ${since}`);
    
    // Apply pushed changes (with conflict resolution based on updated_at)
    await db.bulkUpdate(push);
    
    // Get changes since the client's last sync
    const pullData = await db.getSyncData(since);
    
    const response = {
      server_time: now(),
      pull: pullData,
    };
    
    res.json(response);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(422).json({
        error: 'validation_error',
        message: 'Invalid sync data',
        details: error.errors,
      });
    }
    logger.error('Error during sync:', error);
    res.status(500).json({ 
      error: 'internal_server_error', 
      message: 'Sync failed' 
    });
  }
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'internal_server_error',
    message: 'Something went wrong',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Route not found',
  });
});

// Initialize database and start server
async function startServer() {
  try {
    logger.info('Starting server initialization...');
    logger.info('Current working directory:', process.cwd());
    
    await db.init();
    logger.info('Database initialized');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('Detailed error:', error); // Also log to console for debugging
    process.exit(1);
  }
}

startServer();
