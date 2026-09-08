import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { apiResponse } from './api';

export async function downloadExport(
  path: string,
  filename: string,
  mimeType: string,
) {
  const response = await apiResponse(path);
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(new Uint8Array(await response.arrayBuffer()));
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('Este dispositivo no permite compartir archivos.');
  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: 'Guardar exportación de Finance Pro',
  });
}
