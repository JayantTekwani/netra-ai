// Cryptographic Ledger - SIH Architecture Implementation
// Uses Merkle Trees for batching to prevent bloat, and Off-chain PII to comply with DPDP Act.

export interface Transaction {
  id: string;
  timestamp: string;
  action: string;
  // DPDP Compliance: We never store PII in the transaction on-chain.
  // We only store a salted hash of the payload. The actual PII lives off-chain.
  offChainPayloadHash: string; 
}

export interface Block {
  index: number;
  timestamp: string;
  merkleRoot: string; // Batching transactions using a Merkle Root
  previousHash: string;
  hash: string;
  nonce: number;
  transactions: Transaction[];
}

export class Blockchain {
  public chain: Block[];
  public pendingTransactions: Transaction[];

  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
  }

  // Helper to hash generic strings
  private async hashString(input: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Calculate Merkle Root of an array of transactions
  private async calculateMerkleRoot(transactions: Transaction[]): Promise<string> {
    if (transactions.length === 0) return await this.hashString("EMPTY_BLOCK");
    
    let hashes = await Promise.all(transactions.map(t => this.hashString(t.id + t.offChainPayloadHash)));
    
    while (hashes.length > 1) {
      if (hashes.length % 2 !== 0) hashes.push(hashes[hashes.length - 1]!); // duplicate last if odd
      const nextLevel: string[] = [];
      for (let i = 0; i < hashes.length; i += 2) {
        nextLevel.push(await this.hashString(hashes[i]! + hashes[i + 1]!));
      }
      hashes = nextLevel;
    }
    return hashes[0]!;
  }

  private async calculateBlockHash(index: number, previousHash: string, timestamp: string, merkleRoot: string, nonce: number): Promise<string> {
    return this.hashString(index + previousHash + timestamp + merkleRoot + nonce);
  }

  public async initializeGenesisBlock() {
    if (this.chain.length > 0) return;
    const timestamp = new Date().toISOString();
    const merkleRoot = await this.hashString("GENESIS");
    const hash = await this.calculateBlockHash(0, "0", timestamp, merkleRoot, 0);
    this.chain.push({
      index: 0,
      timestamp,
      merkleRoot,
      previousHash: "0",
      hash,
      nonce: 0,
      transactions: []
    });
  }

  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1]!;
  }

  // Add a transaction to the mempool
  public async addTransaction(action: string, rawPayload: any) {
    // Hash the PII payload BEFORE it touches the ledger (DPDP Act Compliance)
    const offChainPayloadHash = await this.hashString(JSON.stringify(rawPayload) + "SECRET_SALT");
    
    this.pendingTransactions.push({
      id: "TXN-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      offChainPayloadHash
    });
  }

  // Mine pending transactions into a block
  public async minePendingTransactions(): Promise<Block | null> {
    if (this.pendingTransactions.length === 0) return null;

    const latestBlock = this.getLatestBlock();
    const index = latestBlock.index + 1;
    const timestamp = new Date().toISOString();
    const previousHash = latestBlock.hash;
    
    // Create Merkle Root to compress transactions
    const transactionsToMine = [...this.pendingTransactions];
    const merkleRoot = await this.calculateMerkleRoot(transactionsToMine);
    
    // Proof of Work
    let nonce = 0;
    let hash = await this.calculateBlockHash(index, previousHash, timestamp, merkleRoot, nonce);
    
    while (!hash.startsWith("00")) { // Difficulty target
      nonce++;
      hash = await this.calculateBlockHash(index, previousHash, timestamp, merkleRoot, nonce);
    }

    const newBlock: Block = {
      index,
      timestamp,
      merkleRoot,
      previousHash,
      hash,
      nonce,
      transactions: transactionsToMine
    };

    this.chain.push(newBlock);
    this.pendingTransactions = []; // clear mempool
    return newBlock;
  }

  public async isChainValid(): Promise<boolean> {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i]!;
      const previousBlock = this.chain[i - 1]!;

      // Verify block integrity
      const recalculatedHash = await this.calculateBlockHash(
        currentBlock.index,
        currentBlock.previousHash,
        currentBlock.timestamp,
        currentBlock.merkleRoot,
        currentBlock.nonce
      );

      if (currentBlock.hash !== recalculatedHash) return false;
      if (currentBlock.previousHash !== previousBlock.hash) return false;
      
      // Verify Merkle Root matches the transactions
      const validMerkle = await this.calculateMerkleRoot(currentBlock.transactions);
      if (currentBlock.merkleRoot !== validMerkle) return false;
    }
    return true;
  }
}

// Global singleton for the prototype session
export const ledger = new Blockchain();
