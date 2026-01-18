import * as fs from 'fs/promises';
import * as path from 'path';
import { Context } from '../models/Context';

export interface MemoryEntry {
  id: string;
  timestamp: number;
  agentId: string;
  content: string;
  metadata: Record<string, any>;
}

export interface PersistentMemoryConfig {
  storagePath: string;
  maxEntries?: number;
  autoSave?: boolean;
}

export class PersistentMemory {
  private memoryEntries: MemoryEntry[] = [];
  private config: PersistentMemoryConfig;
  private context: Context;

  constructor(config: PersistentMemoryConfig, context: Context) {
    this.config = {
      maxEntries: 1000,
      autoSave: true,
      ...config
    };
    this.context = context;
    this.ensureStorageDirectory();
  }

  /**
   * Ensure the storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.storagePath, { recursive: true });
    } catch (error: any) {
      console.error(`Failed to create storage directory: ${error.message}`);
    }
  }

  /**
   * Load memory entries from persistent storage
   */
  async load(): Promise<void> {
    const memoryFilePath = path.join(this.config.storagePath, 'memory.json');
    
    try {
      const data = await fs.readFile(memoryFilePath, 'utf-8');
      const loadedEntries: MemoryEntry[] = JSON.parse(data);
      
      // Only load entries up to maxEntries limit
      this.memoryEntries = loadedEntries.slice(-(this.config.maxEntries || 1000));
      
      // Restore entries to context as well
      for (const entry of this.memoryEntries) {
        this.context.addMessage(entry.agentId, entry.content);
      }
    } catch (error: any) {
      // If file doesn't exist or is invalid, start fresh
      if (error.code !== 'ENOENT') {
        console.warn(`Could not load memory from file: ${error.message}`);
      }
      this.memoryEntries = [];
    }
  }

  /**
   * Save memory entries to persistent storage
   */
  async save(): Promise<void> {
    const memoryFilePath = path.join(this.config.storagePath, 'memory.json');
    
    try {
      // Limit entries to maxEntries
      const entriesToSave = this.config.maxEntries 
        ? this.memoryEntries.slice(-this.config.maxEntries)
        : this.memoryEntries;
        
      await fs.writeFile(memoryFilePath, JSON.stringify(entriesToSave, null, 2));
    } catch (error: any) {
      console.error(`Failed to save memory to file: ${error.message}`);
    }
  }

  /**
   * Add a new memory entry
   */
  async add(agentId: string, content: string, metadata: Record<string, any> = {}): Promise<void> {
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      agentId,
      content,
      metadata
    };

    this.memoryEntries.push(entry);

    // Maintain max entries limit
    if (this.config.maxEntries && this.memoryEntries.length > this.config.maxEntries) {
      this.memoryEntries = this.memoryEntries.slice(-this.config.maxEntries);
    }

    // Add to context as well
    this.context.addMessage(agentId, content);

    // Auto-save if enabled
    if (this.config.autoSave) {
      await this.save();
    }
  }

  /**
   * Retrieve memory entries by agent ID
   */
  getByAgent(agentId: string, limit?: number): MemoryEntry[] {
    const filtered = this.memoryEntries.filter(entry => entry.agentId === agentId);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get all memory entries (used by vector memory system)
   */
  getAllEntries(): MemoryEntry[] {
    return [...this.memoryEntries]; // Return copy to prevent external mutation
  }

  /**
   * Retrieve recent memory entries
   */
  getRecent(limit: number = 10): MemoryEntry[] {
    return this.memoryEntries.slice(-limit);
  }

  /**
   * Search memory entries by content
   */
  search(searchTerm: string, limit: number = 10): MemoryEntry[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matches = this.memoryEntries.filter(entry => 
      entry.content.toLowerCase().includes(lowerSearchTerm) ||
      JSON.stringify(entry.metadata).toLowerCase().includes(lowerSearchTerm)
    );
    return matches.slice(-limit);
  }

  /**
   * Clear all memory entries
   */
  async clear(): Promise<void> {
    this.memoryEntries = [];
    this.context.messages = []; // Clear the context messages directly
    if (this.config.autoSave) {
      await this.save();
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): { totalEntries: number; agents: string[]; oldest: number; newest: number } {
    if (this.memoryEntries.length === 0) {
      return {
        totalEntries: 0,
        agents: [],
        oldest: 0,
        newest: 0
      };
    }

    const agents = [...new Set(this.memoryEntries.map(entry => entry.agentId))];
    const timestamps = this.memoryEntries.map(entry => entry.timestamp);
    
    return {
      totalEntries: this.memoryEntries.length,
      agents,
      oldest: Math.min(...timestamps),
      newest: Math.max(...timestamps)
    };
  }

  /**
   * Export memory to a different format
   */
  export(format: 'json' | 'text' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.memoryEntries, null, 2);
    } else {
      return this.memoryEntries.map(entry => 
        `[${new Date(entry.timestamp).toISOString()}] ${entry.agentId}: ${entry.content}`
      ).join('\n');
    }
  }

  /**
   * Import memory from a serialized format
   */
  async import(serializedData: string, format: 'json' | 'text' = 'json'): Promise<void> {
    if (format === 'json') {
      const importedEntries: MemoryEntry[] = JSON.parse(serializedData);
      this.memoryEntries = importedEntries;
    } else {
      // Simple text import - not implemented in detail for this version
      console.warn('Text import not fully implemented');
    }

    // Reload context from memory entries
    this.context.messages = [];
    for (const entry of this.memoryEntries) {
      this.context.addMessage(entry.agentId, entry.content);
    }

    if (this.config.autoSave) {
      await this.save();
    }
  }
}