/**
 * NovaLance Transaction Notification System
 *
 * Provides toast notifications, transaction tracking, and user feedback
 * for all blockchain interactions.
 */

'use client';

import { Hash, getAddress } from 'viem';
import { getExplorerUrl } from './contract';

// ============================================================================
// Transaction State Types
// ============================================================================

export type TransactionStatus = 'pending' | 'success' | 'error' | 'unknown';

export interface Transaction {
  hash: Hash;
  description: string;
  status: TransactionStatus;
  timestamp: number;
  chainId: number;
  from?: string;
  to?: string;
  value?: bigint;
  error?: string;
}

export interface TransactionNotification {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  txHash?: Hash;
  duration?: number;
}

// ============================================================================
// Transaction Store (in-memory + localStorage)
// ============================================================================

class TransactionStore {
  private transactions: Map<Hash, Transaction> = new Map();
  private listeners: Set<() => void> = new Set();
  private storageKey = 'novalance_transactions';

  constructor() {
    // Load from localStorage on init
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Only load recent transactions (last 24 hours)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        Object.entries(data).forEach(([hash, tx]: [string, unknown]) => {
          const transaction = tx as Transaction;
          if (transaction.timestamp > dayAgo) {
            this.transactions.set(hash as Hash, transaction);
          }
        });
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      const data = Object.fromEntries(this.transactions);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Ignore storage errors (e.g., quota exceeded)
    }
  }

  add(transaction: Omit<Transaction, 'timestamp'>) {
    const tx = {
      ...transaction,
      timestamp: Date.now(),
    } as Transaction;
    this.transactions.set(tx.hash, tx);
    this.saveToStorage();
    this.notifyListeners();
    return tx;
  }

  update(hash: Hash, updates: Partial<Transaction>) {
    const tx = this.transactions.get(hash);
    if (tx) {
      this.transactions.set(hash, { ...tx, ...updates });
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  get(hash: Hash): Transaction | undefined {
    return this.transactions.get(hash);
  }

  getAll(): Transaction[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );
  }

  getByStatus(status: TransactionStatus): Transaction[] {
    return this.getAll().filter((tx) => tx.status === status);
  }

  remove(hash: Hash) {
    this.transactions.delete(hash);
    this.saveToStorage();
    this.notifyListeners();
  }

  clearOld(olderThanMs: number = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - olderThanMs;
    for (const [hash, tx] of this.transactions) {
      if (tx.timestamp < cutoff) {
        this.transactions.delete(hash);
      }
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

// Global transaction store instance
const transactionStore = new TransactionStore();

// ============================================================================
// Toast Notification System
// ============================================================================

class ToastManager {
  private toasts: Map<string, TransactionNotification> = new Map();
  private listeners: Set<() => void> = new Set();

  show(notification: Omit<TransactionNotification, 'id'>): string {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast = {
      ...notification,
      id,
    };
    this.toasts.set(id, toast);
    this.notifyListeners();

    // Auto-remove after duration (default 5 seconds)
    setTimeout(() => {
      this.remove(id);
    }, notification.duration ?? 5000);

    return id;
  }

  remove(id: string) {
    this.toasts.delete(id);
    this.notifyListeners();
  }

  getAll(): TransactionNotification[] {
    return Array.from(this.toasts.values());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

// Global toast manager instance
const toastManager = new ToastManager();

// ============================================================================
// React Hook for Toast Notifications
// ============================================================================

import { useState, useEffect } from 'react';

export function useToasts() {
  const [toasts, setToasts] = useState<TransactionNotification[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(() => {
      setToasts(toastManager.getAll());
    });

    setToasts(toastManager.getAll());

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    toasts,
    show: (notification: Omit<TransactionNotification, 'id'>) =>
      toastManager.show(notification),
    remove: (id: string) => toastManager.remove(id),
  };
}

// ============================================================================
// React Hook for Transaction Tracking
// ============================================================================

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const unsubscribe = transactionStore.subscribe(() => {
      setTransactions(transactionStore.getAll());
    });

    setTransactions(transactionStore.getAll());

    // Clean up old transactions periodically
    const interval = setInterval(() => {
      transactionStore.clearOld();
    }, 60 * 60 * 1000); // Every hour

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    transactions,
    addTransaction: (tx: Omit<Transaction, 'timestamp'>) =>
      transactionStore.add(tx),
    updateTransaction: (hash: Hash, updates: Partial<Transaction>) =>
      transactionStore.update(hash, updates),
    getTransaction: (hash: Hash) => transactionStore.get(hash),
    removeTransaction: (hash: Hash) => transactionStore.remove(hash),
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Show a transaction pending notification
 */
export function showTransactionPending(
  hash: Hash,
  description: string,
  chainId: number
): void {
  const explorerUrl = getExplorerUrl(hash, chainId);

  toastManager.show({
    type: 'info',
    title: 'Transaction Submitted',
    message: description,
    txHash: hash,
    duration: 10000, // Show for 10 seconds
  });

  // Add to transaction store
  transactionStore.add({
    hash,
    description,
    status: 'pending',
    chainId,
  });
}

/**
 * Show a transaction success notification
 */
export function showTransactionSuccess(
  hash: Hash,
  description?: string
): void {
  const tx = transactionStore.get(hash);
  const finalDescription = description || tx?.description || 'Transaction completed';

  toastManager.show({
    type: 'success',
    title: 'Transaction Successful',
    message: finalDescription,
    txHash: hash,
  });

  // Update transaction status
  transactionStore.update(hash, { status: 'success' });
}

/**
 * Show a transaction error notification
 */
export function showTransactionError(
  hash: Hash,
  error: Error | string,
  description?: string
): void {
  const tx = transactionStore.get(hash);
  const finalDescription = description || tx?.description || 'Transaction failed';
  const errorMessage = typeof error === 'string' ? error : error.message;

  toastManager.show({
    type: 'error',
    title: 'Transaction Failed',
    message: `${finalDescription}: ${errorMessage}`,
    txHash: hash,
    duration: 8000,
  });

  // Update transaction status
  transactionStore.update(hash, {
    status: 'error',
    error: errorMessage,
  });
}

/**
 * Show an info notification
 */
export function showInfo(title: string, message: string, duration?: number): void {
  toastManager.show({
    type: 'info',
    title,
    message,
    duration,
  });
}

/**
 * Show a success notification
 */
export function showSuccess(title: string, message: string, duration?: number): void {
  toastManager.show({
    type: 'success',
    title,
    message,
    duration,
  });
}

/**
 * Show a warning notification
 */
export function showWarning(title: string, message: string, duration?: number): void {
  toastManager.show({
    type: 'warning',
    title,
    message,
    duration,
  });
}

/**
 * Show an error notification
 */
export function showError(title: string, message: string, duration?: number): void {
  toastManager.show({
    type: 'error',
    title,
    message,
    duration,
  });
}

/**
 * Get transaction explorer URL
 */
export function getTransactionExplorerUrl(hash: Hash, chainId: number): string {
  return getExplorerUrl(hash, chainId);
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: Hash): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get time since transaction
 */
export function getTimeSince(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============================================================================
// Transaction Notification Component
// ============================================================================

/**
 * Higher-order function to wrap contract calls with automatic notifications
 */
export function withTransactionNotifications<T extends (...args: unknown[]) => Promise<Hash>>(
  fn: T,
  description: string,
  onSuccess?: (hash: Hash) => void,
  onError?: (error: Error) => void
): T {
  return (async (...args: unknown[]) => {
    try {
      const hash = await fn(...args);
      showTransactionPending(hash, description, 8453); // TODO: Get actual chainId
      return hash;
    } catch (error) {
      const err = error as Error;
      showError('Transaction Failed', `${description}: ${err.message}`);
      onError?.(err);
      throw error;
    }
  }) as T;
}
