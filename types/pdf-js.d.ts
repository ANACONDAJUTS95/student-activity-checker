declare module 'pdfjs-dist/build/pdf' {
  export * from 'pdfjs-dist';
}

declare module 'pdfjs-dist/build/pdf.worker.min.js' {
  const worker: any;
  export default worker;
}