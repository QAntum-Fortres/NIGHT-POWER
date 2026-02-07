export class PineconeVectorStore {
    async initialize() { console.log('[MEMORY] Initialized.'); }
    async getStats() { return { totalVectors: 0 }; }
    async upsert(data: any, index: string) { console.log('[MEMORY] Upserted.'); }
}
