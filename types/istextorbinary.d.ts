 declare module 'istextorbinary' {
  export interface Options {
    /**
     * How many bytes to check at the start.
     * @default 24
     */
    chunkLength?: number;

    /**
     * The offset to start checking from at the beginning.
     * @default 0
     */
    chunkBegin?: number;

    /**
     * How many bytes to check at the end.
     * @default 24
     */
    chunkEnd?: number;
  }

  /**
   * Determine the encoding of a buffer.
   */
  export function getEncoding(
    buffer: Buffer | Uint8Array,
    options?: Options
  ): 'utf8' | 'binary' | null;
}