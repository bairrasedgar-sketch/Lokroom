// Mock Prisma for tests
const mockProfile = {
  userId: 'mock-id',
  firstName: 'Test',
  lastName: 'User',
  phone: '+33612345678',
  city: 'Paris',
  country: 'France',
  birthDate: null,
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  province: null,
  avatarUrl: null,
  ratingAvg: 0,
  ratingCount: 0,
  preferredLanguage: 'fr',
  autoTranslate: false,
  emergencyContactName: null,
  emergencyContactPhone: null,
  emergencyContactRelation: null,
};

const mockUser = {
  id: 'mock-id',
  email: 'test-export-123@example.com',
  name: 'Test Export User',
  role: 'GUEST',
  country: null,
  createdAt: new Date('2024-01-01'),
  lastLoginAt: null,
  identityStatus: 'NONE',
  emailVerified: null,
  twoFactorSecret: null,
  profile: mockProfile,
  hostProfile: null,
  Listing: [],
  bookings: [],
  messages: [],
  favorites: [],
  notifications: [],
  searchHistory: [],
  wishlists: [],
  reviewsWritten: [],
  reviewsReceived: [],
  disputesOpened: [],
  UserConsent: [],
  auditLogs: [],
  wallet: null,
};

const createMockModel = (defaultData = {}) => ({
  create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mock-id', ...data })),
  findUnique: jest.fn().mockImplementation(({ where }) => {
    if (where?.id === 'non-existent-id') return Promise.resolve(null);
    return Promise.resolve({ id: 'mock-id', ...defaultData });
  }),
  findMany: jest.fn().mockResolvedValue([]),
  findFirst: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mock-id', ...data })),
  updateMany: jest.fn().mockResolvedValue({ count: 0 }),
  delete: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  count: jest.fn().mockResolvedValue(0),
  upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve({ id: 'mock-id', ...create })),
  aggregate: jest.fn().mockResolvedValue({}),
  groupBy: jest.fn().mockResolvedValue([]),
});

export const prisma = {
  user: {
    ...createMockModel(mockUser),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where?.id === 'non-existent-id') return Promise.resolve(null);
      return Promise.resolve(mockUser);
    }),
  },
  userProfile: {
    ...createMockModel(mockProfile),
    findUnique: jest.fn().mockResolvedValue(mockProfile),
  },
  hostProfile: {
    ...createMockModel(),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  listing: createMockModel(),
  booking: createMockModel(),
  review: createMockModel(),
  message: createMockModel(),
  conversation: createMockModel(),
  favorite: createMockModel(),
  notification: createMockModel(),
  dataExportRequest: {
    ...createMockModel(),
    findMany: jest.fn().mockResolvedValue([{ id: 'mock-export-id', status: 'completed' }]),
  },
  dispute: createMockModel(),
  payment: createMockModel(),
  payPalTransaction: createMockModel(),
  walletLedger: createMockModel(),
  promoCode: createMockModel(),
  badge: createMockModel(),
  userBadge: createMockModel(),
  adminNote: createMockModel(),
  supportConversation: createMockModel(),
  supportMessage: createMockModel(),
  searchHistory: createMockModel(),
  wishlist: createMockModel(),
  wishlistItem: createMockModel(),
  userRecommendation: createMockModel(),
  $transaction: jest.fn().mockImplementation((fn) => fn(prisma)),
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
};
