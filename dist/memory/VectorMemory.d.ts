import { MemoryEntry } from './PersistentMemory';
/**
 * Configuration for vector memory system
 */
export interface VectorMemoryConfig {
    /**
     * Whether vector memory is enabled (DEFAULT: false)
     * When disabled, system behaves exactly as before
     */
    enabled: boolean;
    /**
     * Number of embedding dimensions (DEFAULT: 384)
     * Using sentence-transformers/all-MiniLM-L6-v2 dimensions
     */
    dimensions: number;
    /**
     * Number of top-K semantically similar memories to retrieve (DEFAULT: 3)
     */
    topK: number;
    /**
     * Rebuild index when this many new entries are added (DEFAULT: 10)
     */
    rebuildThreshold: number;
}
/**
 * Vector memory system for semantic retrieval of agent memories
 *
 * PURPOSE: Augments existing chronological memory access with semantic search
 * BEHAVIOR: When enabled, retrieves top-K semantically relevant memories in addition to recent ones
 * SAFETY: Completely optional - system works identically when disabled
 */
export declare class VectorMemory {
    private config;
    private persistentMemory;
    private pipeline;
    private embeddingsCache;
    private dirtyCount;
    constructor(config: Partial<VectorMemoryConfig>, persistentMemory: any);
    /**
     * Initialize the embedding pipeline
     * Uses lightweight transformer model suitable for edge deployment
     */
    private initializePipeline;
    /**
     * Generate embedding for text content
     */
    private generateEmbedding;
    /**
     * Build or rebuild the embedding cache from persistent memory
     * Called during initialization and periodically when new entries are added
     */
    buildEmbeddingCache(): Promise<void>;
    /**
     * Add new entries to embedding cache
     */
    updateEmbeddings(newEntries: MemoryEntry[]): Promise<void>;
    /**
     * Perform semantic search for relevant memories
     * @param query - Current context or task to find relevant memories for
     * @param agentId - Agent whose memories to search
     * @returns Top-K most semantically similar memory entries
     */
    search(query: string, agentId: string): Promise<MemoryEntry[]>;
    /**
     * Calculate dot product of two vectors (cosine similarity for normalized vectors)
     */
    private dotProduct;
    /**
     * Enable vector memory (can be called at runtime)
     */
    enable(): Promise<void>;
    /**
     * Disable vector memory (can be called at runtime)
     */
    disable(): void;
    /**
     * Get current status
     */
    getStatus(): {
        enabled: boolean;
        cachedEntries: number;
        dirtyCount: number;
    };
}
