export const hybridHealer = {
    heal: async (error: any) => {
        console.log('[HEALER] Healing...');
        return { action: 'RETRY' };
    }
};
