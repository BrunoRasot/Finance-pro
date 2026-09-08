import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import type { Environment } from '../../../config/environment';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const ownerId = '26f95e0f-28ac-4cd8-b510-b3fc32d88e4a';
  const models = {
    goalContribution: { deleteMany: jest.fn() },
    transaction: { deleteMany: jest.fn() },
    transfer: { deleteMany: jest.fn() },
    budget: { deleteMany: jest.fn() },
    savingsGoal: { deleteMany: jest.fn() },
    account: { deleteMany: jest.fn() },
  };
  const client = {
    $transaction: jest.fn((operation: (tx: typeof models) => unknown) =>
      Promise.resolve(operation(models)),
    ),
  };
  const database = { client } as unknown as DatabaseService;
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('deletes every financial collection before deleting the identity', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const config = new ConfigService<Environment, true>({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-with-safe-length',
    });
    const service = new ProfileService(database, config);

    await service.delete(ownerId);

    for (const model of Object.values(models)) {
      expect(model.deleteMany).toHaveBeenCalledWith({ where: { ownerId } });
    }
    expect(global.fetch).toHaveBeenCalledWith(
      `https://project.supabase.co/auth/v1/admin/users/${ownerId}`,
      expect.objectContaining({
        method: 'DELETE',
        headers: { apikey: 'service-role-key-with-safe-length' },
      }),
    );
  });

  it('sends a legacy JWT service-role key as a bearer token', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    const legacyKey = `eyJ${'a'.repeat(24)}`;
    const config = new ConfigService<Environment, true>({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: legacyKey,
    });
    const service = new ProfileService(database, config);

    await service.delete(ownerId);

    expect(global.fetch).toHaveBeenCalledWith(
      `https://project.supabase.co/auth/v1/admin/users/${ownerId}`,
      expect.objectContaining({
        headers: {
          apikey: legacyKey,
          Authorization: `Bearer ${legacyKey}`,
        },
      }),
    );
  });

  it('does not delete financial data when its transaction fails', async () => {
    client.$transaction.mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    global.fetch = jest.fn();
    const config = new ConfigService<Environment, true>({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-with-safe-length',
    });
    const service = new ProfileService(database, config);

    await expect(service.delete(ownerId)).rejects.toThrow(
      'database unavailable',
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('reports an unavailable identity deletion without restoring removed data', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    const config = new ConfigService<Environment, true>({
      SUPABASE_URL: 'https://project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-with-safe-length',
    });
    const service = new ProfileService(database, config);

    await expect(service.delete(ownerId)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
