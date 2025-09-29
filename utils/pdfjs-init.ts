import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';

export function setupPdfWorker() {
  if (typeof window !== 'undefined') {
    // Use a dynamic import for the worker
    import('pdfjs-dist/build/pdf.worker.min.js').then(worker => {
      GlobalWorkerOptions.workerSrc = worker.default;
    });
  }
}