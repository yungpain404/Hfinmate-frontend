type Listener = () => void;

class ExpenseEventEmitter {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.warn('[ExpenseEventEmitter] Listener error:', err);
      }
    }
  }
}

export const expenseEvents = new ExpenseEventEmitter();
