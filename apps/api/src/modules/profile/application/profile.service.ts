import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Environment } from '../../../config/environment';
import { DatabaseService } from '../../../infrastructure/database/database.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  async delete(ownerId: string): Promise<void> {
    await this.database.client.$transaction(async (transaction) => {
      await transaction.goalContribution.deleteMany({ where: { ownerId } });
      await transaction.transaction.deleteMany({ where: { ownerId } });
      await transaction.transfer.deleteMany({ where: { ownerId } });
      await transaction.budget.deleteMany({ where: { ownerId } });
      await transaction.savingsGoal.deleteMany({ where: { ownerId } });
      await transaction.account.deleteMany({ where: { ownerId } });
    });

    const supabaseUrl = this.config.get('SUPABASE_URL', { infer: true });
    const serviceKey = this.config.get('SUPABASE_SERVICE_ROLE_KEY', {
      infer: true,
    });
    if (!supabaseUrl || !serviceKey) {
      throw new ServiceUnavailableException(
        'La eliminación de la identidad no está disponible temporalmente.',
      );
    }

    const headers: Record<string, string> = { apikey: serviceKey };
    // Legacy service_role keys are JWTs and Auth expects them as Bearer tokens.
    // Modern sb_secret_ keys are opaque API keys and must not be parsed as JWTs.
    if (serviceKey.startsWith('eyJ')) {
      headers.Authorization = `Bearer ${serviceKey}`;
    }

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${ownerId}`, {
        method: 'DELETE',
        headers,
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Los datos financieros se eliminaron, pero no pudimos cerrar la cuenta. Inténtalo de nuevo.',
      );
    }
    if (!response.ok && response.status !== 404) {
      throw new ServiceUnavailableException(
        'Los datos financieros se eliminaron, pero no pudimos cerrar la cuenta. Inténtalo de nuevo.',
      );
    }
  }
}
