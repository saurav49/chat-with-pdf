export interface PDFFile {
  id: string;
  name: string;
  file?: File;
  url?: string;
  fileKey?: string; // reference key for indexedDB
  size?: number;
  type?: string;
  lastModified?: number;
}
