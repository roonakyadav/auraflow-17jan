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
export declare class PersistentMemory {
    private memoryEntries;
    private config;
    private context;
    constructor(config: PersistentMemoryConfig, context: Context);
    /**
     * Ensure the storage directory exists
     */
    private ensureStorageDirectory;
    /**
     * Load memory entries from persistent storage
     */
    load(): Promise<void>;
    /**
     * Save memory entries to persistent storage
     */
    save(): Promise<void>;
    /**
     * Add a new memory entry
     */
    add(agentId: string, content: string, metadata?: Record<string, any>): Promise<void>;
    /**
     * Retrieve memory entries by agent ID
     */
    getByAgent(agentId: string, limit?: number): MemoryEntry[];
    /**
     * Get all memory entries (used by vector memory system)
     */
    getAllEntries(): MemoryEntry[];
    /**
     * Retrieve recent memory entries
     */
    getRecent(limit?: number): MemoryEntry[];
    /**
     * Search memory entries by content
     */
    search(searchTerm: string, limit?: number): MemoryEntry[];
    /**
     * Clear all memory entries
     */
    clear(): Promise<void>;
    /**
     * Get memory statistics
     */
    getStats(): {
        totalEntries: number;
        agents: string[];
        oldest: number;
        newest: number;
    };
    /**
     * Export memory to a different format
     */
    export(format?: 'json' | 'text'): string;
    /**
     * Import memory from a serialized format
     */
    import(serializedData: string, format?: 'json' | 'text'): Promise<void>;
}
