/**
 * Fixtures utilisateurs pour les tests E2E
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: 'GUEST' | 'HOST' | 'ADMIN';
}

export const testUsers = {
  guest: {
    email: 'guest@test.lokroom.com',
    password: 'GuestTest123!',
    name: 'Test Guest',
    role: 'GUEST' as const,
  },

  host: {
    email: 'host@test.lokroom.com',
    password: 'HostTest123!',
    name: 'Test Host',
    role: 'HOST' as const,
  },

  admin: {
    email: 'admin@test.lokroom.com',
    password: 'AdminTest123!',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  },

  // Utilisateur pour tester l'inscription
  newUser: {
    email: 'newuser@test.lokroom.com',
    password: 'NewUser123!',
    name: 'New Test User',
    role: 'GUEST' as const,
  },
};

export const getTestUser = (role: 'guest' | 'host' | 'admin' | 'newUser'): TestUser => {
  return testUsers[role];
};
