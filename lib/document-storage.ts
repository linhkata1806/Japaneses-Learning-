// File storage is intentionally unavailable for now. Keep the route-facing
// contract so uploads can be restored without changing D1 document metadata.
export const documentUploadsEnabled = false;
export const documentUploadUnavailableMessage =
  "Tính năng tải tài liệu đang tạm thời chưa khả dụng.";

export interface DocumentStorage {
  put(path: string, file: File): Promise<void>;
  get(path: string): Promise<Blob | null>;
  delete(path: string): Promise<void>;
}

export function getDocumentStorage(): DocumentStorage | null {
  return null;
}
