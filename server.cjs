const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // For cross-origin requests from React app

const app = express();
const PORT = 3001; // Choose a port different from React app's default (3000)

const PROMPTS_FILE = path.join(__dirname, 'prompts.json');

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Helper to read prompts from file
const readPrompts = () => {
    if (!fs.existsSync(PROMPTS_FILE)) {
        // Initialize with a fallback safe prompt if file doesn't exist
        const initialPrompts = {
            activePromptId: 'fallback',
            prompts: {
                'fallback': {
                    id: 'fallback',
                    name: 'Fallback Safe Prompt',
                    content: 'You are a helpful AI assistant.',
                    isFallback: true
                }
            }
        };
        fs.writeFileSync(PROMPTS_FILE, JSON.stringify(initialPrompts, null, 2));
        return initialPrompts;
    }
    const data = fs.readFileSync(PROMPTS_FILE, 'utf8');
    return JSON.parse(data);
};

// Helper to write prompts to file
const writePrompts = (data) => {
    fs.writeFileSync(PROMPTS_FILE, JSON.stringify(data, null, 2));
};

// API Endpoints

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Server is healthy');
});

// GET all prompts
app.get('/api/prompts', (req, res) => {
    const { prompts } = readPrompts();
    res.json(Object.values(prompts));
});

// GET active prompt
app.get('/api/prompts/active', (req, res) => {
    const { activePromptId, prompts } = readPrompts();
    const activePrompt = prompts[activePromptId];
    if (activePrompt) {
        res.json(activePrompt);
    } else {
        // Fallback if activePromptId is invalid
        res.json(prompts['fallback']);
    }
});

// GET a single prompt by ID
app.get('/api/prompts/:id', (req, res) => {
    const { id } = req.params;
    const { prompts } = readPrompts();
    const prompt = prompts[id];
    if (prompt) {
        res.json(prompt);
    } else {
        res.status(404).json({ message: 'Prompt not found.' });
    }
});

// POST new prompt
app.post('/api/prompts', (req, res) => {
    const { name, content } = req.body;
    if (!name || !content) {
        return res.status(400).json({ message: 'Name and content are required.' });
    }
    const data = readPrompts();
    const newId = Date.now().toString();
    data.prompts[newId] = { id: newId, name, content, isFallback: false };
    writePrompts(data);
    res.status(201).json(data.prompts[newId]);
});

// PUT update prompt
app.put('/api/prompts/:id', (req, res) => {
    const { id } = req.params;
    const { name, content } = req.body;
    const data = readPrompts();
    if (!data.prompts[id]) {
        return res.status(404).json({ message: 'Prompt not found.' });
    }
    if (data.prompts[id].isFallback) {
        return res.status(403).json({ message: 'Fallback prompt cannot be edited.' });
    }
    data.prompts[id] = { ...data.prompts[id], name: name || data.prompts[id].name, content: content || data.prompts[id].content };
    writePrompts(data);
    res.json(data.prompts[id]);
});

// DELETE prompt
app.delete('/api/prompts/:id', (req, res) => {
    const { id } = req.params;
    const data = readPrompts();
    if (!data.prompts[id]) {
        return res.status(404).json({ message: 'Prompt not found.' });
    }
    if (data.prompts[id].isFallback) {
        return res.status(403).json({ message: 'Fallback prompt cannot be deleted.' });
    }
    if (data.activePromptId === id) {
        data.activePromptId = 'fallback'; // Switch to fallback if active is deleted
    }
    delete data.prompts[id];
    writePrompts(data);
    res.status(204).send();
});

// PUT set active prompt
app.put('/api/prompts/active/:id', (req, res) => {
    const { id } = req.params;
    const data = readPrompts();
    if (!data.prompts[id]) {
        return res.status(404).json({ message: 'Prompt not found.' });
    }
    data.activePromptId = id;
    writePrompts(data);
    res.json(data.prompts[id]);
});

// POST reset to fallback
app.post('/api/prompts/reset-fallback', (req, res) => {
    const data = readPrompts();
    data.activePromptId = 'fallback';
    writePrompts(data);
    res.json(data.prompts['fallback']);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Prompt Manager API running on http://localhost:${PORT}`);
    // Ensure prompts.json exists and is initialized
    readPrompts();
}).on('error', (err) => {
    console.error('Failed to start server:', err);
});
