
export type MutationType = 
  | 'MATCH_UPDATE' 
  | 'ORG_CREATE' 
  | 'TEAM_UPDATE' 
  | 'PLAYER_UPDATE' 
  | 'MEDIA_UPLOAD';

export interface Mutation {
  id: string;
  type: MutationType;
  payload: any;
  timestamp: number;
  retryCount: number;
}

const STORAGE_KEY = 'cc_sync_queue';

class OfflineQueueService {
  private queue: Mutation[] = [];
  private isProcessing: boolean = false;
  private listeners: ((queue: Mutation[], isOnline: boolean) => void)[] = [];

  constructor() {
    this.loadQueue();
    window.addEventListener('online', () => this.processQueue());
    window.addEventListener('offline', () => this.notifyListeners());
  }

  private loadQueue() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load sync queue", e);
    }
  }

  private saveQueue() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    this.notifyListeners();
  }

  public enqueue(type: MutationType, payload: any) {
    const mutation: Mutation = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    };
    this.queue.push(mutation);
    this.saveQueue();
    
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  public async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !navigator.onLine) return;

    this.isProcessing = true;
    this.notifyListeners();

    // Clone queue to process
    const currentBatch = [...this.queue];
    
    // Process items sequentially
    for (const item of currentBatch) {
      try {
        await this.syncItem(item);
        // Remove from queue on success
        this.queue = this.queue.filter(m => m.id !== item.id);
        this.saveQueue();
      } catch (error) {
        console.error(`Failed to sync item ${item.id}`, error);
        // Increment retry, keep in queue
        const index = this.queue.findIndex(m => m.id === item.id);
        if (index !== -1) {
            this.queue[index].retryCount++;
        }
        this.saveQueue();
        break; // Stop processing on error to preserve order
      }
    }

    this.isProcessing = false;
    this.notifyListeners();
  }

  // Mock Backend Call
  private async syncItem(item: Mutation): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate network latency
      setTimeout(() => {
        // In a real app, this would be fetch('/api/sync', ...)
        console.log(`[SYNC] Processed ${item.type}`, item.payload);
        
        // Random failure simulation (5% chance)
        if (Math.random() < 0.05) {
            reject(new Error("Random network glitch"));
        } else {
            resolve();
        }
      }, 500); // 500ms latency
    });
  }

  public subscribe(listener: (queue: Mutation[], isOnline: boolean) => void) {
    this.listeners.push(listener);
    // Initial call
    listener(this.queue, navigator.onLine);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.queue, navigator.onLine));
  }

  public getStatus() {
    return {
      pendingCount: this.queue.length,
      isOnline: navigator.onLine,
      isProcessing: this.isProcessing
    };
  }
}

export const offlineQueue = new OfflineQueueService();
