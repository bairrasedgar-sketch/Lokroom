// Environment setup for tests (runs before setupTests.ts)
process.env.REDIS_URL = 'redis://localhost:6379';

// Polyfills for jsdom
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
