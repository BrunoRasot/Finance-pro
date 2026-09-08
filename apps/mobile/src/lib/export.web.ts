import { apiResponse } from './api';

export async function downloadExport(path: string, filename: string) {
  const response = await apiResponse(path);
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
