"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorMemory = void 0;
/**
 * Vector memory system for semantic retrieval of agent memories
 *
 * PURPOSE: Augments existing chronological memory access with semantic search
 * BEHAVIOR: When enabled, retrieves top-K semantically relevant memories in addition to recent ones
 * SAFETY: Completely optional - system works identically when disabled
 */
class VectorMemory {
    config;
    persistentMemory; // Reference to PersistentMemory instance
    pipeline = null; // Transformer pipeline for embeddings
    embeddingsCache = new Map();
    dirtyCount = 0; // Track new entries since last rebuild
    constructor(config, persistentMemory) {
        this.config = {
            enabled: false, // DISABLED BY DEFAULT - preserves existing behavior
            dimensions: 384, // Standard for MiniLM embeddings
            topK: 3, // Conservative default
            rebuildThreshold: 10, // Rebuild every 10 new entries
            ...config
        };
        this.persistentMemory = persistentMemory;
        // Only initialize pipeline if enabled
        if (this.config.enabled) {
            this.initializePipeline();
        }
    }
    /**
     * Initialize the embedding pipeline
     * Uses lightweight transformer model suitable for edge deployment
     */
    async initializePipeline() {
        try {
            // Dynamic import to avoid loading when disabled
            const { pipeline } = await Promise.resolve().then(() => __importStar(require('@xenova/transformers')));
            this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                quantized: true // Use quantized model for smaller size
            });
            console.log('✓ Vector memory pipeline initialized');
        }
        catch (error) {
            console.warn(`⚠ Vector memory initialization failed: ${error.message}`);
            console.warn('⚠ Falling back to chronological memory only');
            this.config.enabled = false;
        }
    }
    /**
     * Generate embedding for text content
     */
    async generateEmbedding(text) {
        if (!this.config.enabled || !this.pipeline)
            return null;
        try {
            const output = await this.pipeline(text, {
                pooling: 'mean',
                normalize: true
            });
            return output.data; // Returns Float32Array
        }
        catch (error) {
            console.warn(`⚠ Embedding generation failed: ${error.message}`);
            return null;
        }
    }
    /**
     * Build or rebuild the embedding cache from persistent memory
     * Called during initialization and periodically when new entries are added
     */
    async buildEmbeddingCache() {
        if (!this.config.enabled)
            return;
        console.log('🔄 Building vector memory embeddings...');
        try {
            // Get all memory entries for this agent
            const allEntries = this.persistentMemory.getAllEntries();
            // Generate embeddings for each entry
            for (const entry of allEntries) {
                if (!this.embeddingsCache.has(entry.id)) {
                    const embedding = await this.generateEmbedding(entry.content);
                    if (embedding) {
                        this.embeddingsCache.set(entry.id, embedding);
                    }
                }
            }
            this.dirtyCount = 0;
            console.log(`✓ Vector memory built: ${this.embeddingsCache.size} embeddings cached`);
        }
        catch (error) {
            console.warn(`⚠ Vector memory build failed: ${error.message}`);
        }
    }
    /**
     * Add new entries to embedding cache
     */
    async updateEmbeddings(newEntries) {
        if (!this.config.enabled)
            return;
        for (const entry of newEntries) {
            if (!this.embeddingsCache.has(entry.id)) {
                const embedding = await this.generateEmbedding(entry.content);
                if (embedding) {
                    this.embeddingsCache.set(entry.id, embedding);
                }
            }
        }
        this.dirtyCount += newEntries.length;
        // Rebuild if threshold reached
        if (this.dirtyCount >= this.config.rebuildThreshold) {
            await this.buildEmbeddingCache();
        }
    }
    /**
     * Perform semantic search for relevant memories
     * @param query - Current context or task to find relevant memories for
     * @param agentId - Agent whose memories to search
     * @returns Top-K most semantically similar memory entries
     */
    async search(query, agentId) {
        if (!this.config.enabled)
            return [];
        try {
            // Generate embedding for query
            const queryEmbedding = await this.generateEmbedding(query);
            if (!queryEmbedding)
                return [];
            // Get agent's memories
            const agentEntries = this.persistentMemory.getByAgent(agentId);
            // Calculate similarities
            const similarities = [];
            for (const entry of agentEntries) {
                const entryEmbedding = this.embeddingsCache.get(entry.id);
                if (entryEmbedding) {
                    // Cosine similarity
                    const dotProduct = this.dotProduct(queryEmbedding, entryEmbedding);
                    const similarity = dotProduct; // Already normalized
                    similarities.push({ entry, similarity });
                }
            }
            // Sort by similarity and return top-K
            similarities.sort((a, b) => b.similarity - a.similarity);
            return similarities.slice(0, this.config.topK).map(s => s.entry);
        }
        catch (error) {
            console.warn(`⚠ Vector search failed: ${error.message}`);
            return [];
        }
    }
    /**
     * Calculate dot product of two vectors (cosine similarity for normalized vectors)
     */
    dotProduct(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += a[i] * b[i];
        }
        return sum;
    }
    /**
     * Enable vector memory (can be called at runtime)
     */
    async enable() {
        if (this.config.enabled)
            return;
        this.config.enabled = true;
        await this.initializePipeline();
        await this.buildEmbeddingCache();
    }
    /**
     * Disable vector memory (can be called at runtime)
     */
    disable() {
        this.config.enabled = false;
        this.embeddingsCache.clear();
        this.pipeline = null;
    }
    /**
     * Get current status
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            cachedEntries: this.embeddingsCache.size,
            dirtyCount: this.dirtyCount
        };
    }
}
exports.VectorMemory = VectorMemory;
//# sourceMappingURL=VectorMemory.js.map