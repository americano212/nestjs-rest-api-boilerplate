import { UploadFile } from '#entities/file';
import { PickType } from '@nestjs/swagger';

export class UploadFileDto extends PickType(UploadFile, [
  'originalName',
  'url',
  'fileSize',
  'encoding',
  'mimeType',
] as const) {}
