import { api } from '../api-client';
import { logger } from '../logger';

/**
 * Tests unitaires pour l'API Client
 * Architecture professionnelle avec tests complets
 */

describe('API Client', () => {
  describe('TokenManager', () => {
    it('should store and retrieve token', async () => {
      const { TokenManager } = await import('../api-client');
      const testToken = 'test-jwt-token-123';

      await TokenManager.setToken(testToken);
      const retrieved = await TokenManager.getToken();

      expect(retrieved).toBe(testToken);
    });

    it('should remove token', async () => {
      const { TokenManager } = await import('../api-client');
      const testToken = 'test-jwt-token-123';

      await TokenManager.setToken(testToken);
      await TokenManager.removeToken();
      const retrieved = await TokenManager.getToken();

      expect(retrieved).toBeNull();
    });
  });

  describe('API Calls', () => {
    beforeEach(() => {
      // Mock fetch
      global.fetch = jest.fn();
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

    it('should retry on failure', async () => {
      const mockData = { id: 1, name: 'Test' };

      // Fail twice, then succeed
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockData,
        });

      const result = await api.get('/api/test', { retry: 3 });

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual(mockData);
    });

    it('should handle 401 and remove token', async () => {
      const { TokenManager } = await import('../api-client');
      await TokenManager.setToken('test-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(api.get('/api/test')).rejects.toThrow();

      const token = await TokenManager.getToken();
      expect(token).toBeNull();
    });

    it('should timeout after specified duration', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      await expect(
        api.get('/api/test', { timeout: 100 })
      ).rejects.toThrow();
    });

    it('should cache GET requests', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      // First call
      const result1 = await api.get('/api/test', { cache: true });

      // Second call (should use cache)
      const result2 = await api.get('/api/test', { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(mockData);
      expect(result2).toEqual(mockData);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
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
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should clear cache', async () => {
      const { clearCache } = await import('../api-client');
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // First call with cache
      await api.get('/api/test', { cache: true });

      // Clear cache
      clearCache();

      // Second call should fetch again
      await api.get('/api/test', { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should expire cache after duration', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      // First call
      await api.get('/api/test', { cache: true });

      // Wait for cache to expire (mock time)
      jest.useFakeTimers();
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes

      // Second call should fetch again
      await api.get('/api/test', { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
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
    expect(logs[0].context?.error.message).toBe('Test error');
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
    // Log more than maxLogs
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
    const { measurePerformance } = await import('./logger');

    const slowFunction = () => {
      return new Promise((resolve) => setTimeout(() => resolve('done'), 100));
    };

    const result = await measurePerformance('slow_function', slowFunction);

    expect(result).toBe('done');

    const logs = logger.getRecentLogs();
    const perfLog = logs.find((log) => log.message.includes('slow_function'));
    expect(perfLog).toBeDefined();
    expect(perfLog?.context?.duration).toBeGreaterThan(90);
  });

  it('should log errors in measured functions', async () => {
    const { measurePerformance } = await import('./logger');

    const failingFunction = () => {
      throw new Error('Function failed');
    };

    await expect(
      measurePerformance('failing_function', failingFunction)
    ).rejects.toThrow('Function failed');

    const logs = logger.getRecentLogs();
    const errorLog = logs.find((log) => log.level === 'error');
    expect(errorLog).toBeDefined();
  });
});
