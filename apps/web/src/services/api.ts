import { 
  Settings, 
  Category, 
  Transaction, 
  Budget, 
  Goal, 
  SyncRequest, 
  SyncResponse,
  ErrorResponse 
} from '@mibudget/shared';

export class ApiError extends Error {
  constructor(
    public status: number,
    public data?: ErrorResponse,
    message?: string
  ) {
    super(message || data?.message || 'API Error');
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:4000/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData: ErrorResponse | undefined;
        try {
          errorData = await response.json();
        } catch {
          // If JSON parsing fails, we'll just use the status
        }
        
        throw new ApiError(response.status, errorData);
      }

      // Handle empty responses (like 204 No Content)
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network errors, CORS issues, etc.
      throw new ApiError(0, undefined, 'Network error or server unavailable');
    }
  }

  // Health check
  async health(): Promise<{ status: string; timestamp: string; version: string }> {
    return this.request('/health');
  }

  // Settings
  async getSettings(): Promise<Settings | null> {
    return this.request('/settings');
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Categories
  async getCategories(since?: number): Promise<Category[]> {
    const query = since ? `?since=${since}` : '';
    return this.request(`/categories${query}`);
  }

  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Category> {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Transactions
  async getTransactions(filters: {
    since?: number;
    category_id?: string;
    goal_id?: string;
    from?: string;
    to?: string;
  } = {}): Promise<Transaction[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/transactions${query}`);
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Transaction> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Budgets
  async getBudgets(since?: number): Promise<Budget[]> {
    const query = since ? `?since=${since}` : '';
    return this.request(`/budgets${query}`);
  }

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Budget> {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    return this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBudget(id: string): Promise<void> {
    return this.request(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Goals
  async getGoals(since?: number): Promise<Goal[]> {
    const query = since ? `?since=${since}` : '';
    return this.request(`/goals${query}`);
  }

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Goal> {
    return this.request('/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    return this.request(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteGoal(id: string): Promise<void> {
    return this.request(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // Sync
  async sync(syncRequest: SyncRequest): Promise<SyncResponse> {
    return this.request('/sync', {
      method: 'POST',
      body: JSON.stringify(syncRequest),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();