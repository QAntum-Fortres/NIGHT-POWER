// bridge.js - The Neural Link between Dashboard and Core

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import DeepSeekOrchestrator
const { DeepSeekOrchestrator } = require('./src/ai/DeepSeekOrchestrator');

const app = express();
app.use(cors());
app.use(bodyParser.json({limit: '10mb'}));

// --- 📂 FILE BROWSER & GOD MODE API ---
app.get('/api/files', (req, res) => {
    const base = process.cwd();
    let dir = req.query.path || '.';
    if (dir.includes('..')) return res.status(400).json([]); // Basic security
    const abs = path.resolve(base, dir);
    fs.readdir(abs, { withFileTypes: true }, (err, files) => {
        if (err) return res.status(500).json([]);
        res.json(files.map(f => ({
            name: f.name,
            type: f.isDirectory() ? 'folder' : 'file',
            path: path.join(dir, f.name).replace(/\\/g, '/')
        })));
    });
});

app.get('/api/read', (req, res) => {
    const base = process.cwd();
    let file = req.query.path;
    if (!file || file.includes('..')) return res.status(400).send('Invalid path');
    const abs = path.resolve(base, file);
    if (!fs.existsSync(abs)) return res.status(404).send('Not found');
    res.download(abs);
});



// --- SCRIPT ARMORY API ---
const SCRIPTS_DIR = path.join(__dirname, 'scripts');

// Helper: Recursively list scripts (js, ts, bat)
function listScripts(dir = SCRIPTS_DIR, relBase = '') {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const abs = path.join(dir, file);
        const rel = path.join(relBase, file);
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) {
            results = results.concat(listScripts(abs, rel));
        } else {
            const ext = path.extname(file).toLowerCase();
            let type = null;
            if (ext === '.js') type = 'javascript';
            else if (ext === '.ts') type = 'typescript';
            else if (ext === '.bat' || ext === '.cmd') type = 'batch';
            if (type) {
                results.push({
                    name: file,
                    path: rel.replace(/\\/g, '/'),
                    type
                });
            }
        }
    }
    return results;
}

// GET /api/scripts - List all scripts
app.get('/api/scripts', (req, res) => {
    try {
        const scripts = listScripts();
        res.json(scripts);
    } catch (e) {
        res.status(500).json({ error: 'Failed to list scripts', details: e.message });
    }
});

// POST /api/execute-script - Run a script by relative path
app.post('/api/execute-script', express.json(), (req, res) => {
    const { scriptPath } = req.body || {};
    if (!scriptPath || typeof scriptPath !== 'string') {
        return res.status(400).json({ error: 'Missing scriptPath' });
    }
    const absPath = path.join(SCRIPTS_DIR, scriptPath);
    if (!absPath.startsWith(SCRIPTS_DIR)) {
        return res.status(403).json({ error: 'Invalid script path' });
    }
    if (!fs.existsSync(absPath)) {
        return res.status(404).json({ error: 'Script not found' });
    }
    const ext = path.extname(absPath).toLowerCase();
    let cmd, args;
    if (ext === '.js') {
        cmd = 'node'; args = [absPath];
    } else if (ext === '.ts') {
        cmd = 'npx'; args = ['ts-node', absPath];
    } else if (ext === '.bat' || ext === '.cmd') {
        cmd = absPath; args = [];
    } else {
        return res.status(400).json({ error: 'Unsupported script type' });
    }

    // Spawn process
    const proc = spawn(cmd, args, { cwd: SCRIPTS_DIR, shell: ext === '.bat' || ext === '.cmd' });
    // Stream output to socket.io 'log' channel
    const log = (msg) => {
        if (io) io.emit('log', `[SCRIPT] ${scriptPath}: ${msg}`);
    };
    proc.stdout.on('data', d => log(d.toString()));
    proc.stderr.on('data', d => log(d.toString()));
    proc.on('close', code => log(`Exited with code ${code}`));

    res.json({ status: 'started' });
});

// CRUD: Create file/folder
app.post('/api/create', (req, res) => {
    const { path: p, type } = req.body;
    if (!p || p.includes('..')) return res.status(400).send('Invalid path');
    const abs = path.resolve(process.cwd(), p);
    if (type === 'folder') fs.mkdir(abs, { recursive: true }, err => err ? res.status(500).send('Error') : res.send('OK'));
    else fs.writeFile(abs, '', err => err ? res.status(500).send('Error') : res.send('OK'));
});

// CRUD: Delete file/folder
app.post('/api/delete', (req, res) => {
    const { path: p } = req.body;
    if (!p || p.includes('..')) return res.status(400).send('Invalid path');
    const abs = path.resolve(process.cwd(), p);
    fs.stat(abs, (err, stat) => {
        if (err) return res.status(404).send('Not found');
        if (stat.isDirectory()) fs.rmdir(abs, { recursive: true }, err => err ? res.status(500).send('Error') : res.send('OK'));
        else fs.unlink(abs, err => err ? res.status(500).send('Error') : res.send('OK'));
    });
});

// CRUD: Rename file/folder
app.post('/api/rename', (req, res) => {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath || oldPath.includes('..') || newPath.includes('..')) return res.status(400).send('Invalid path');
    const absOld = path.resolve(process.cwd(), oldPath);
    const absNew = path.resolve(process.cwd(), newPath);
    fs.rename(absOld, absNew, err => err ? res.status(500).send('Error') : res.send('OK'));
});

// Save file
app.post('/api/save', (req, res) => {
    const { path: p, content } = req.body;
    if (!p || p.includes('..')) return res.status(400).send('Invalid path');
    const abs = path.resolve(process.cwd(), p);
    fs.writeFile(abs, content, err => err ? res.status(500).send('Error') : res.send('OK'));
});

// List Node.js processes
app.get('/api/processes', (req, res) => {
    const ps = spawn('ps', ['-eo', 'pid,comm,rss'], { shell: true });
    let out = '';
    ps.stdout.on('data', d => out += d.toString());
    ps.on('close', () => {
        const lines = out.split('\n').slice(1).filter(l => l.includes('node'));
        const procs = lines.map(l => {
            const [pid, name, mem] = l.trim().split(/\s+/, 3);
            return { pid, name, mem: mem ? (parseInt(mem)/1024).toFixed(1)+' MB' : '' };
        });
        res.json(procs);
    });
});

// Kill process
app.post('/api/kill', (req, res) => {
    const { pid } = req.body;
    if (!pid) return res.status(400).send('No PID');
    try {
        if (Number(pid) === -1) {
            // KILL ALL NODE.JS
            const ps = spawn('ps', ['-eo', 'pid,comm'], { shell: true });
            let out = '';
            ps.stdout.on('data', d => out += d.toString());
            ps.on('close', () => {
                out.split('\n').forEach(line => {
                    const [pid, name] = line.trim().split(/\s+/, 2);
                    if (name === 'node' && pid && pid != process.pid) {
                        try { process.kill(Number(pid)); } catch {}
                    }
                });
                res.send('OK');
            });
        } else {
            process.kill(Number(pid));
            res.send('OK');
        }
    } catch {
        res.status(500).send('Error');
    }
});


// Port scanner
app.get('/api/ports', async (req, res) => {
    const net = require('net');
    const open = [];
    const ports = Array.from({length: 30}, (_, i) => 3000 + i); // Scan 3000-3029
    let checked = 0;
    ports.forEach(port => {
        const s = net.createConnection({ port, host: '127.0.0.1' });
        s.on('connect', () => { open.push(port); s.destroy(); });
        s.on('error', () => {});
        s.on('close', () => { if(++checked===ports.length) res.json(open); });
    });
});

// 1. Сервираме Дашборда и Данните
app.use(express.static(path.join(__dirname, 'dashboard')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

console.log('🔌 QANTUM NERVE BRIDGE INITIALIZING...');

// 2. Карта на Протоколите (Mapping commands to REAL files)
const PROTOCOLS = {
    'AUDIT': { 
        cmd: 'node', 
        args: ['scripts/system-audit.js'],
        desc: 'SYSTEM INTEGRITY CHECK'
    },
    'HUNT': { 
        cmd: 'node', 
        args: ['scripts/lead-hunter.js'],
        desc: 'OPERATION MIDAS (LEAD GENERATION)'
    },
    'MAP': { 
        cmd: 'node', 
        args: ['scripts/nucleus-mapper.js'],
        desc: 'GENERATING NEURAL MAP'
    },
    'GUARDIAN': { 
        cmd: 'node', 
        args: ['scripts/eternal-guardian.js'],
        desc: 'ACTIVATING ACTIVE DEFENSE'
    },
    'MEDITATE': {
        cmd: 'npx',
        args: ['ts-node', 'scripts/system-meditate.ts'], // Ако имаш TS
        desc: 'SYSTEM MEDITATION & HEALING'
    }
};

io.on('connection', (socket) => {
    // --- 💻 TERMINAL INPUT ---
    socket.on('terminal_input', (cmd) => {
        if (!cmd || typeof cmd !== 'string') return;
        const proc = spawn(cmd, { cwd: process.cwd(), shell: true });
        socket.emit('log', `<span style=\"color:#10B981\">$ ${cmd}</span>`);
        proc.stdout.on('data', (data) => {
            socket.emit('log', data.toString());
        });
        proc.stderr.on('data', (data) => {
            socket.emit('log', `<span style=\"color:#ef4444\">⚠️ ${data.toString().trim()}</span>`);
        });
        proc.on('close', (code) => {
            const color = code === 0 ? '#10B981' : '#EF4444';
            socket.emit('log', `<span style=\"color:${color}\">[process exited: ${code}]</span>`);
        });
    });
    console.log(`⚡ NERVE CONNECTED: ${socket.id}`);

    // Прихващане на команди от интерфейса (button actions)
    socket.on('execute_command', (protocolKey) => {
        const protocol = PROTOCOLS[protocolKey];
        if (!protocol) {
            socket.emit('log', `❌ ERROR: Unknown protocol signature: ${protocolKey}`);
            return;
        }
        console.log(`🚀 LAUNCHING: ${protocol.desc}`);
        socket.emit('log', `> INITIALИЗИNG PROTOCOL: ${protocolKey}...`);
        socket.emit('log', `> EXEC: ${protocol.cmd} ${protocol.args.join(' ')}`);
        // Изпълнение на процеса
        const process = spawn(protocol.cmd, protocol.args, {
            cwd: __dirname,
            shell: true
        });
        // Live Streaming на логовете
        process.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) socket.emit('log', line.trim());
            });
        });
        process.stderr.on('data', (data) => {
            socket.emit('log', `<span style=\"color:#ef4444\">⚠️ ${data.toString().trim()}</span>`);
        });
        process.on('close', (code) => {
            const color = code === 0 ? '#10B981' : '#EF4444';
            const status = code === 0 ? 'SUCCESS' : 'FAILED';
            socket.emit('log', `<span style=\"color:${color}\">> PROTOCOL ${status} (Exit Code: ${code})</span>`);
            socket.emit('command_finished', { command: protocolKey, code });
        });
    });

    // --- AI CHAT INTEGRATION ---
    socket.on('chat_message', async (msg) => {
        try {
            const orchestrator = new DeepSeekOrchestrator();
            socket.emit('log', `<span style=\"color:#8B5CF6\">🤖 MISTER MIND: Thinking...</span>`);
            const result = await orchestrator.processIntent(msg);
            // Emit AI response, action, and raw data
            socket.emit('ai_response', {
                thought: result.thought,
                action: result.action,
                response: result.response,
                data: result.data
            });
        } catch (err) {
            socket.emit('ai_response', {
                thought: 'Critical error.',
                response: 'AI integration failed.',
                data: String(err)
            });
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  🧠 QANTUM COMMAND STATION ONLINE                ║`);
    console.log(`║  🌐 Uplink: http://localhost:${PORT}/command-station.html ║`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);
});
