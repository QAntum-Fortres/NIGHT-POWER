/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QUANTUM MOBILE BRIDGE
 * ═══════════════════════════════════════════════════════════════════════════════
 * The Neural Link between the PWA Dashboard and the Android Native Substrate.
 * 
 * Capability Vector:
 * 1. Checks for 'window.QuantumNative' injection.
 * 2. Provides JS wrappers for Native Methods (startCapture/stopCapture).
 * 3. Handles fallback if not running on Quantum Hardware.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

class QuantumMobileBridge {
    constructor() {
        this.isConnected = false;
        this.substrateVersion = "0.0.0";
        this.bridgeMode = "DISCONNECTED"; // NATIVE | TUNNEL | DISCONNECTED

        // Bind methods
        this.initialize = this.initialize.bind(this);
        this.startCapture = this.startCapture.bind(this);
        this.stopCapture = this.stopCapture.bind(this);
        this.getTelemetry = this.getTelemetry.bind(this);
    }

    /**
     * Initialize the Neural Link
     */
    async initialize() {
        console.log("🔌 Quantum Bridge: Initializing Neural Link...");

        // 1. Check for Direct Native Injection (WebView)
        if (window.QuantumNative) {
            console.log("✨ Quantum Bridge: Native Substrate Detected (WebView).");
            this.isConnected = true;
            this.bridgeMode = "NATIVE";
            this.substrateVersion = window.QuantumNative.getVersion ? window.QuantumNative.getVersion() : "1.0.0";

            this.triggerUIUpdate();
            return true;
        }

        // 2. Fallback: Check for Localhost Tunnel (TCP Bridge)
        try {
            console.log("🔍 Quantum Bridge: Scanning for TCP Tunnel...");
            const response = await fetch('http://localhost:8888', {
                method: 'POST',
                body: JSON.stringify({ type: 'HEARTBEAT', id: 'init-check' })
            });

            if (response.ok) {
                console.log("🚇 Quantum Bridge: TCP Tunnel Established.");
                this.isConnected = true;
                this.bridgeMode = "TUNNEL";
                this.triggerUIUpdate();
                return true;
            }
        } catch (e) {
            console.log("❌ Quantum Bridge: No Substrate Connection Found.");
        }

        this.isConnected = false;
        this.bridgeMode = "DISCONNECTED";
        this.triggerUIUpdate();
        return false;
    }

    /**
     * Update Dashboard UI with Bridge Status
     */
    triggerUIUpdate() {
        const statusElement = document.getElementById('bridge-connection-status');
        const controlPanel = document.getElementById('mobile-control-panel');

        if (statusElement) {
            if (this.isConnected) {
                statusElement.innerHTML = `
                    <span class="status-dot success"></span>
                    <span class="status-text">CONNECTED (${this.bridgeMode})</span>
                `;
                statusElement.classList.add('connected');

                if (controlPanel) controlPanel.classList.remove('hidden');
            } else {
                statusElement.innerHTML = `
                    <span class="status-dot error"></span>
                    <span class="status-text">DISCONNECTED</span>
                `;
                statusElement.classList.remove('connected');

                if (controlPanel) controlPanel.classList.add('hidden');
            }
        }

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('QUANTUM_BRIDGE_UPDATE', {
            detail: {
                connected: this.isConnected,
                mode: this.bridgeMode
            }
        }));
    }

    /**
     * Command: START GHOST CAPTURE
     */
    startCapture() {
        if (!this.isConnected) return console.warn("Bridge Disconnected");

        console.log("👻 Quantum Bridge: Engaging Ghost Protocol...");

        if (this.bridgeMode === "NATIVE") {
            window.QuantumNative.startCapture();
            this.showToast("Ghost Protocol Engaged");
        } else if (this.bridgeMode === "TUNNEL") {
            this.sendTunnelCommand({ action: "TOGGLE_STEALTH", active: true });
        }
    }

    /**
     * Command: STOP GHOST CAPTURE
     */
    stopCapture() {
        if (!this.isConnected) return console.warn("Bridge Disconnected");

        console.log("🛑 Quantum Bridge: Disengaging Ghost Protocol...");

        if (this.bridgeMode === "NATIVE") {
            window.QuantumNative.stopCapture();
            this.showToast("Ghost Protocol Standing Down");
        } else if (this.bridgeMode === "TUNNEL") {
            this.sendTunnelCommand({ action: "TOGGLE_STEALTH", active: false });
        }
    }

    /**
     * Get Hardware Telemetry
     */
    getTelemetry() {
        if (this.bridgeMode === "NATIVE" && window.QuantumNative.getTelemetry) {
            return JSON.parse(window.QuantumNative.getTelemetry());
        }
        return null;
    }

    // --- Private Helpers ---

    async sendTunnelCommand(payload) {
        try {
            await fetch('http://localhost:8888', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'COMMAND',
                    id: Date.now().toString(),
                    payload: payload
                })
            });
        } catch (e) {
            console.error("Tunnel Command Failed:", e);
        }
    }

    showToast(message) {
        // Simple visual feedback
        const toast = document.createElement('div');
        toast.className = 'quantum-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Global Singleton
window.quantumBridge = new QuantumMobileBridge();

// Auto-Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    window.quantumBridge.initialize();
});
