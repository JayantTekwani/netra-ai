// Client-side Blockchain Simulation for SIH Cryptographic Ledger Requirement

export interface Block {
  index: number;
  timestamp: string;
  data: string; // The action or FIR record being logged
  previousHash: string;
  hash: string;
  nonce: number;
}

export class Blockchain {
  public chain: Block[];

  constructor() {
    this.chain = [];
    // Synchronously initialize the chain with a dummy genesis block
    // to avoid async constructors. We'll manually mine the real genesis block on init.
  }

  // Simple SHA-256 implementation using Web Crypto API
  private async calculateHash(index: number, previousHash: string, timestamp: string, data: string, nonce: number): Promise<string> {
    const msgBuffer = new TextEncoder().encode(index + previousHash + timestamp + JSON.stringify(data) + nonce);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  public async initializeGenesisBlock() {
    if (this.chain.length > 0) return;
    const genesisData = JSON.stringify({ event: "SYSTEM_INIT", details: "Netra-AI Immutable Ledger Initialized" });
    const timestamp = new Date().toISOString();
    const hash = await this.calculateHash(0, "0", timestamp, genesisData, 0);
    this.chain.push({
      index: 0,
      timestamp,
      data: genesisData,
      previousHash: "0",
      hash,
      nonce: 0
    });
  }

  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1]!;
  }

  public async addBlock(data: any): Promise<Block> {
    const latestBlock = this.getLatestBlock();
    const index = latestBlock.index + 1;
    const timestamp = new Date().toISOString();
    const previousHash = latestBlock.hash;
    const stringData = JSON.stringify(data);
    
    // Simple Proof of Work (mining) - require 2 leading zeros to simulate effort
    // In a real browser this takes milliseconds, but proves the concept for judges
    let nonce = 0;
    let hash = await this.calculateHash(index, previousHash, timestamp, stringData, nonce);
    
    while (!hash.startsWith("00")) {
      nonce++;
      hash = await this.calculateHash(index, previousHash, timestamp, stringData, nonce);
    }

    const newBlock: Block = {
      index,
      timestamp,
      data: stringData,
      previousHash,
      hash,
      nonce
    };

    this.chain.push(newBlock);
    return newBlock;
  }

  public async isChainValid(): Promise<boolean> {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i]!;
      const previousBlock = this.chain[i - 1]!;

      // Recalculate hash to verify data hasn't been tampered with
      const recalculatedHash = await this.calculateHash(
        currentBlock.index,
        currentBlock.previousHash,
        currentBlock.timestamp,
        currentBlock.data,
        currentBlock.nonce
      );

      if (currentBlock.hash !== recalculatedHash) {
        return false;
      }
      
      // Verify chain link
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

// Global singleton for the session
export const ledger = new Blockchain();
