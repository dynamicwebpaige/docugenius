import { SignatureStyle } from './types';

export const GEMINI_MODEL_VISION = 'gemini-3-flash-preview';

export const SIGNATURE_STYLES: SignatureStyle[] = [
  { id: 'style1', fontFamily: 'font-signature1', label: 'Classic' },
  { id: 'style2', fontFamily: 'font-signature2', label: 'Modern' },
  { id: 'style3', fontFamily: 'font-signature3', label: 'Artistic' },
];

export const PDF_WORKER_URL = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;