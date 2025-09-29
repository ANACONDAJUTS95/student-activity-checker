declare module 'word-extractor' {
  export default class WordExtractor {
    constructor();
    extract(buffer: ArrayBuffer): Promise<{
      getBody(): string;
      getHeaders(): any;
      getFooters(): any;
    }>;
  }
}