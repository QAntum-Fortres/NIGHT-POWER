// Mock needs to be defined BEFORE require
const mockExec = jest.fn();
jest.mock('child_process', () => {
    return {
        exec: mockExec
    };
});

const request = require('supertest');
const app = require('../../bridge');
const child_process = require('child_process');

describe('Bridge API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('POST /api/ask should return 400 if prompt is missing', async () => {
        const res = await request(app).post('/api/ask').send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body).toEqual({ error: 'Prompt is required' });
    });

    it('POST /api/ask should execute script and return response', async () => {
        const mockStdout = 'Mock AI Response';
        mockExec.mockImplementation((cmd, callback) => {
            callback(null, mockStdout, ');
        });

        const res = await request(app)
            .post('/api/ask')
            .send({ prompt: 'Hello' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({ response: mockStdout });
        expect(mockExec).toHaveBeenCalledWith(
            expect.stringContaining('npx ts-node scripts/ask-ai.ts "Hello"'),
            expect.any(Function)
        );
    });

    it('POST /api/ask should handle execution errors', async () => {
        mockExec.mockImplementation((cmd, callback) => {
            callback(new Error('Command failed'), ', 'Error details');
        });

        const res = await request(app)
            .post('/api/ask')
            .send({ prompt: 'Hello' });

        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('error', 'Failed to execute AI');
    });
});
