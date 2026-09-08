import { Equals } from 'class-validator';

export class DeleteProfileDto {
  @Equals('ELIMINAR')
  confirmation!: string;
}
