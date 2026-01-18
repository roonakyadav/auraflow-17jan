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
export class VectorMemory {
  private config: VectorMemoryConfig;
  private persistentMemory: any; // Reference to PersistentMemory instance
  private pipeline: any = null;   // Transformer pipeline for embeddings
  private embeddingsCache: Map<string, Float32Array> = new Map();
  private dirtyCount: number = 0; // Track new entries since last rebuild
  
  constructor(config: Partial<VectorMemoryConfig>, persistentMemory: any) {
    this.config = {
      enabled: false,        // DISABLED BY DEFAULT - preserves existing behavior
      dimensions: 384,       // Standard for MiniLM embeddings
      topK: 3,               // Conservative default
      rebuildThreshold: 10,  // Rebuild every 10 new entries
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
  private async initializePipeline(): Promise<void> {
    try {
      // Dynamic import to avoid loading when disabled
      const { pipeline } = await import('@xenova/transformers');
      this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true  // Use quantized model for smaller size
      });
      console.log('✓ Vector memory pipeline initialized');
    } catch (error: any) {
      console.warn(`⚠ Vector memory initialization failed: ${error.message}`);
      console.warn('⚠ Falling back to chronological memory only');
      this.config.enabled = false;
    }
  }
  
  /**
   * Generate embedding for text content
   */
  private async generateEmbedding(text: string): Promise<Float32Array | null> {
    if (!this.config.enabled || !this.pipeline) return null;
    
    try {
      const output = await this.pipeline(text, { 
        pooling: 'mean',
        normalize: true
      });
      return output.data; // Returns Float32Array
    } catch (error: any) {
      console.warn(`⚠ Embedding generation failed: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Build or rebuild the embedding cache from persistent memory
   * Called during initialization and periodically when new entries are added
   */
  async buildEmbeddingCache(): Promise<void> {
    if (!this.config.enabled) return;
    
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
      
    } catch (error: any) {
      console.warn(`⚠ Vector memory build failed: ${error.message}`);
    }
  }
  
  /**
   * Add new entries to embedding cache
   */
  async updateEmbeddings(newEntries: MemoryEntry[]): Promise<void> {
    if (!this.config.enabled) return;
    
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
  async search(query: string, agentId: string): Promise<MemoryEntry[]> {
    if (!this.config.enabled) return [];
    
    try {
      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) return [];
      
      // Get agent's memories
      const agentEntries = this.persistentMemory.getByAgent(agentId);
      
      // Calculate similarities
      const similarities: Array<{ entry: MemoryEntry; similarity: number }> = [];
      
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
      
    } catch (error: any) {
      console.warn(`⚠ Vector search failed: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Calculate dot product of two vectors (cosine similarity for normalized vectors)
   */
  private dotProduct(a: Float32Array, b: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }
  
  /**
   * Enable vector memory (can be called at runtime)
   */
  async enable(): Promise<void> {
    if (this.config.enabled) return;
    
    this.config.enabled = true;
    await this.initializePipeline();
    await this.buildEmbeddingCache();
  }
  
  /**
   * Disable vector memory (can be called at runtime)
   */
  disable(): void {
    this.config.enabled = false;
    this.embeddingsCache.clear();
    this.pipeline = null;
  }
  
  /**
   * Get current status
   */
  getStatus(): { enabled: boolean; cachedEntries: number; dirtyCount: number } {
    return {
      enabled: this.config.enabled,
      cachedEntries: this.embeddingsCache.size,
      dirtyCount: this.dirtyCount
    };
  }
}