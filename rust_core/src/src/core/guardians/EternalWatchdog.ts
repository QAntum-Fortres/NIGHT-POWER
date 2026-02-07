import { EventEmitter } from 'events';

export class EternalWatchdog extends EventEmitter {
    constructor(config: any) {
        super();
    }
    start() { console.log('[WATCHDOG] Started.'); }
    stop() { console.log('[WATCHDOG] Stopped.'); }
}

export function getGlobalWatchdog(config: any) {
    return new EternalWatchdog(config);
}
