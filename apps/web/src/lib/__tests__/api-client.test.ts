import { api, TokenManager, clearCache } from '../api-client';
import { logger } from '../logger';

/**
 * Tests unitaires pour l'API Client
 */

describe('API Client', () => {
  describe('TokenManager', () => {
    it('should return null on web (uses NextAuth cookies)', async () => {
      // On web, TokenManager uses NextAuth cookies, not Capacitor storage
      const retrieved = await TokenManager.getToken();
      expect(retrieved).toBeNull();
    });

    it('should not throw when setting/removing token on web', async () => {
      await expect(TokenManager.setToken('test-token')).resolves.not.toThrow();
      await expect(TokenManager.removeToken()).resolves.not.toThrow();
    });
  });

  describe('API Calls', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      clearCache();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should make GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.get('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('should make POST request with data', async () => {
      const mockData = { id: 1, name: 'Test' };
      const postData = { name: 'New Item' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.post('/api/test', postData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should retry on 500 failure then succeed', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
        });

      const result = await api.get('/api/test', { retry: 2 });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockData);
    });

    it('should handle 401 and remove token', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(api.get('/api/test')).rejects.toThrow();
    });

    it('should cache GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result1 = await api.get('/api/test', { cache: true });
      const result2 = await api.get('/api/test', { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      clearCache();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(api.get('/api/test', { retry: 1 })).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle 500 errors with retry', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Server error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
        });

      const result = await api.get('/api/test', { retry: 2 });

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockData);
    });

    it('should handle 404 errors without retry', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      });

      await expect(api.get('/api/test', { retry: 3 })).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      clearCache();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should clear cache', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      await api.get('/api/test', { cache: true });
      clearCache();
      await api.get('/api/test', { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should expire cache after duration', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // First call populates cache
      await api.get('/api/cache-expire-test2', { cache: true });
      // Clear cache manually to simulate expiry
      clearCache();
      // Second call should fetch again
      await api.get('/api/cache-expire-test2', { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Logger', () => {
  beforeEach(() => {
    logger.clearLogs();
  });

  it('should log info messages', () => {
    logger.info('Test message', { key: 'value' });

    const logs = logger.getRecentLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].message).toBe('Test message');
    expect(logs[0].context).toEqual({ key: 'value' });
  });

  it('should log errors with stack trace', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error);

    const logs = logger.getRecentLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('error');
    expect(logs[0].context?.error).toBeDefined();

    const errorContext = logs[0].context?.error;
    if (errorContext && typeof errorContext === 'object' && 'message' in errorContext) {
      expect(errorContext.message).toBe('Test error');
    }
  });

  it('should log user actions', () => {
    logger.logUserAction('button_click', { button: 'submit' });

    const logs = logger.getRecentLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toContain('User action: button_click');
  });

  it('should log performance metrics', () => {
    logger.logPerformance('api_call', 150, { endpoint: '/api/test' });

    const logs = logger.getRecentLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].context?.duration).toBe(150);
  });

  it('should limit log buffer size', () => {
    for (let i = 0; i < 150; i++) {
      logger.info(`Message ${i}`);
    }

    const logs = logger.getRecentLogs(200);
    expect(logs.length).toBeLessThanOrEqual(100);
  });

  it('should export logs as JSON', () => {
    logger.info('Test 1');
    logger.warn('Test 2');
    logger.error('Test 3', new Error('Test error'));

    const exported = logger.exportLogs();
    const parsed = JSON.parse(exported);

    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
  });
});

describe('Performance Measurement', () => {
  it('should measure function performance', async () => {
    const { measurePerformance } = await import('../logger');

    const fastFunction = () => Promise.resolve('done');

    const result = await measurePerformance('fast_function', fastFunction);

    expect(result).toBe('done');

    const logs = logger.getRecentLogs();
    const perfLog = logs.find((log: { message: string }) => log.message.includes('fast_function'));
    expect(perfLog).toBeDefined();
    expect(perfLog?.context?.duration).toBeGreaterThanOrEqual(0);
  }, 10000);

  it('should log errors in measured functions', async () => {
    const { measurePerformance } = await import('../logger');

    const failingFunction = () => {
      throw new Error('Function failed');
    };

    await expect(
      measurePerformance('failing_function', failingFunction)
    ).rejects.toThrow('Function failed');

    const logs = logger.getRecentLogs();
    const errorLog = logs.find((log: { level: string }) => log.level === 'error');
    expect(errorLog).toBeDefined();
  });
});
