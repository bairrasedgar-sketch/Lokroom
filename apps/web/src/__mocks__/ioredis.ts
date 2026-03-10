// Mock ioredis using ioredis-mock (without problematic options)
const RedisMock = require('ioredis-mock');

// Create a shared instance so all tests share the same state
let sharedInstance: InstanceType<typeof RedisMock> | null = null;

function getSharedInstance() {
  if (!sharedInstance) {
    sharedInstance = new RedisMock();
  }
  return sharedInstance;
}

// Mock the Redis constructor to return the shared instance
const Redis = jest.fn().mockImplementation(() => getSharedInstance());

// Add static methods
(Redis as any).Cluster = jest.fn();

module.exports = Redis;
module.exports.default = Redis;
