import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { PDFPageData, FormField } from '../types';
import { PDF_WORKER_URL } from '../constants';

// Initialize worker
// Handle potential ESM/CJS interop issues where the library is on the 'default' property
const pdfAPI = (pdfjsLib as any).default || pdfjsLib;

if (pdfAPI.GlobalWorkerOptions) {
  pdfAPI.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
}

export const convertPDFToImages = async (file: File): Promise<PDFPageData[]> => {
  const arrayBuffer = await file.arrayBuffer();
  // Use the resolved API object to get the document
  const pdfDoc = await pdfAPI.getDocument({ data: arrayBuffer }).promise;
  const pageImages: PDFPageData[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // High quality for detection
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    pageImages.push({
      pageIndex: i - 1, // 0-indexed internally
      imageUrl: canvas.toDataURL('image/jpeg', 0.8),
      width: viewport.width,
      height: viewport.height,
    });
  }

  return pageImages;
};

export const generateSignedPDF = (pages: PDFPageData[], fields: FormField[]): string => {
  if (pages.length === 0) return '';

  // Initialize jsPDF. Orientation depends on the first page, but we'll adjust per page.
  const doc = new jsPDF({
    orientation: pages[0].width > pages[0].height ? 'l' : 'p',
    unit: 'px',
    format: [pages[0].width, pages[0].height],
  });

  pages.forEach((page, index) => {
    if (index > 0) {
      doc.addPage([page.width, page.height], page.width > page.height ? 'l' : 'p');
    }

    // 1. Draw original page image
    doc.addImage(page.imageUrl, 'JPEG', 0, 0, page.width, page.height);

    // 2. Overlay fields
    const pageFields = fields.filter(f => f.pageIndex === index && f.value);
    
    pageFields.forEach(field => {
      if (!field.value) return;

      // Convert normalized coordinates (0-1000) back to pixel coordinates
      const x = (field.box.xmin / 1000) * page.width;
      const y = (field.box.ymin / 1000) * page.height;
      const w = ((field.box.xmax - field.box.xmin) / 1000) * page.width;
      const h = ((field.box.ymax - field.box.ymin) / 1000) * page.height;

      if (field.type === 'signature' || field.type === 'initial') {
        // Draw the signature/initial image
        doc.addImage(field.value, 'PNG', x, y, w, h);
      } else {
        // Draw text
        // Calculate font size roughly based on box height (approx 60-70% of height)
        // Ensure a minimum legible size
        const fontSize = Math.max(10, h * 0.6); 
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0); // Black text
        
        // Vertically center text approx
        const textY = y + (h / 2) + (fontSize / 3);
        
        // Add a small padding from left
        doc.text(field.value, x + 2, textY);
      }
    });
  });

  return doc.output('bloburl').toString(); // Returns a blob URL
};