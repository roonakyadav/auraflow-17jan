export interface Message {
  id: string;
  agentId: string;
  content: string;
  timestamp: Date;
}

/**
 * Represents shared context between agents in a workflow.
 * Contains an ordered list of messages and shared outputs.
 */
export class Context {
  /**
   * Ordered list of messages that agents can read
   */
  messages: Message[];

  /**
   * Map of shared outputs that agents can contribute to
   */
  outputs: Map<string, any>;

  /**
   * Creates a new Context instance with empty messages and outputs
   */
  constructor() {
    this.messages = [];
    this.outputs = new Map();
  }

  /**
   * Adds a message to the shared context
   * @param agentId - ID of the agent adding the message
   * @param content - Content of the message
   */
  addMessage(agentId: string, content: string): void {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      content,
      timestamp: new Date()
    };
    this.messages.push(message);
  }

  /**
   * Retrieves all messages from the shared context
   * @returns Array of all messages in chronological order
   */
  getMessages(): Message[] {
    return [...this.messages]; // Return a copy to prevent external mutation
  }

  /**
   * Adds or updates an output in the shared context
   * @param key - Key to store the output under
   * @param value - Value of the output
   */
  setOutput(key: string, value: any): void {
    this.outputs.set(key, value);
  }

  /**
   * Retrieves an output from the shared context
   * @param key - Key of the output to retrieve
   * @returns Value of the output or undefined if not found
   */
  getOutput(key: string): any {
    return this.outputs.get(key);
  }
}