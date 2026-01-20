export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export type FieldType = 'signature' | 'text' | 'initial';

export interface FormField {
  id: string;
  pageIndex: number;
  box: BoundingBox;
  type: FieldType;
  value?: string; // Data URL for signature, text content for text fields
}

export interface PDFPageData {
  pageIndex: number;
  imageUrl: string; // Base64 or Blob URL
  width: number;
  height: number;
}

export interface SignatureStyle {
  id: string;
  fontFamily: string;
  label: string;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PREVIEW = 'PREVIEW',
  SIGNING = 'SIGNING',
  DOWNLOAD = 'DOWNLOAD'
}