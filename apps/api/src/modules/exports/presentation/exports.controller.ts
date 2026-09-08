import { Controller, Get, Header } from '@nestjs/common';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { ExportsService } from '../application/exports.service';

@Controller('exports')
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('data.json')
  @Header('Cache-Control', 'no-store')
  @Header(
    'Content-Disposition',
    'attachment; filename="finance-pro-backup.json"',
  )
  backup(@CurrentUser() ownerId: string) {
    return this.exportsService.backup(ownerId);
  }

  @Get('transactions.csv')
  @Header('Cache-Control', 'no-store')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="finance-pro-movimientos.csv"',
  )
  transactions(@CurrentUser() ownerId: string) {
    return this.exportsService.transactionsCsv(ownerId);
  }
}
