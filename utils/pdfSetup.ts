import { GlobalWorkerOptions } from 'pdfjs-dist';

export function setupPdfWorker() {
  if (typeof window === 'undefined') return;

  const workerUrl = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
  );

  GlobalWorkerOptions.workerSrc = workerUrl.href;
}