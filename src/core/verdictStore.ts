import type { Verdict } from "../config/branding";

export interface VerdictRecord {
  id: string;
  verdict: Verdict;
  confidence: number;
  timestamp: number;
  tradeAsset: string;
  positionSizeUsd: number;
  reasons: string[];
}

export interface VerdictStoreState {
  currentRecord: VerdictRecord | null;
  history: VerdictRecord[];
}

const STORAGE_KEY = "rtd-verdict-history";

class VerdictStore {
  private state: VerdictStoreState = {
    currentRecord: null,
    history: []
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.state.history = parsed;
          if (parsed.length > 0) {
            this.state.currentRecord = parsed[0];
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load verdict history from storage", e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state.history));
    } catch (e) {
      console.warn("Failed to save verdict history to storage", e);
    }
  }

  public getState(): VerdictStoreState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public addVerdict(record: Omit<VerdictRecord, "id" | "timestamp">): VerdictRecord {
    const fullRecord: VerdictRecord = {
      ...record,
      id: `verdict-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };

    this.state.currentRecord = fullRecord;
    this.state.history = [fullRecord, ...this.state.history].slice(0, 50); // Keep last 50
    this.saveToStorage();
    this.notify();
    return fullRecord;
  }

  public clearHistory() {
    this.state.currentRecord = null;
    this.state.history = [];
    this.saveToStorage();
    this.notify();
  }
}

export const verdictStore = new VerdictStore();
