import { rateLimitTracker } from './rate-limit-tracker';

describe('rateLimitTracker', () => {
  it('separates authenticated users behind the same proxy', () => {
    expect(
      rateLimitTracker({
        ip: '10.0.0.1',
        identity: { userId: 'user-a' },
      }),
    ).toBe('user:user-a');
    expect(
      rateLimitTracker({
        ip: '10.0.0.1',
        identity: { userId: 'user-b' },
      }),
    ).toBe('user:user-b');
  });

  it('uses the connection address for public routes', () => {
    expect(rateLimitTracker({ ip: '127.0.0.1' })).toBe('ip:127.0.0.1');
  });
});
