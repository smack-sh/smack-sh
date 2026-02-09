export default class SwitchableStream extends TransformStream {
  private _controller: TransformStreamDefaultController;
  private _currentReader: ReadableStreamDefaultReader | null = null;
  private _switches = 0;

  constructor() {
    let controllerRef: TransformStreamDefaultController | undefined;

    super({
      start(controller) {
        controllerRef = controller;
      },
      transform(chunk, controller) {
        /*
         * This TransformStream's readable side is driven by `_pumpStream`
         * reading from an external source (`_currentReader`).
         * Chunks arriving at this `transform` method come from the
         * TransformStream's *writable* side. We choose to ignore them
         * to prevent mixing sources or unintended passthrough behavior.
         * If receiving input on the writable side is considered an error,
         * `controller.error(new Error("Input not expected on writable side."));` could be used.
         * For this design, we assume the writable side is simply not used for data input.
         */
      },
      flush(controller) {
        /*
         * Optional: Perform cleanup or final enqueues when the writable side closes.
         * The `close()` method explicitly handles the termination of the readable side.
         */
      },
    });

    /*
     * controllerRef must be set by the start method, which is called synchronously by super().
     * This check is a defensive measure.
     */
    if (controllerRef === undefined) {
      throw new Error('TransformStream controller failed to initialize.');
    }

    this._controller = controllerRef;
  }

  async switchSource(newStream: ReadableStream) {
    if (this._currentReader) {
      /*
       * Cancel the current reader before switching to a new one.
       * This will cause the active `_pumpStream` loop for the old reader to exit.
       */
      await this._currentReader.cancel().catch(() => {}); // Catch cancel errors to avoid unhandled promise rejection.
      this._currentReader.releaseLock(); // Release the lock for the old reader.
      this._currentReader = null; // Mark the old reader as no longer current.
    }

    this._currentReader = newStream.getReader();

    // Start pumping the new stream. Do not await here, as it's a background process.
    this._pumpStream();

    this._switches++;
  }

  private async _pumpStream() {
    const readerToPump = this._currentReader; // Capture the reader instance for *this* pump operation.

    if (!readerToPump || !this._controller) {
      /*
       * This should ideally not be hit if `switchSource` is called correctly,
       * but serves as a safeguard.
       */
      throw new Error('Stream reader or controller is not properly initialized for pumping.');
    }

    try {
      while (true) {
        const { done, value } = await readerToPump.read(); // Use the captured reader.

        if (done) {
          // This specific source stream has ended.
          break;
        }

        this._controller.enqueue(value);
      }
    } catch (error) {
      /*
       * If an error occurs during reading (e.g., source stream errors, or cancelled),
       * log it and propagate it to the output stream.
       */
      console.error('Error in _pumpStream:', error);
      this._controller.error(error);
    } finally {
      /*
       * Ensure the lock for *this specific reader* is released.
       * It's safe to call releaseLock multiple times or on a cancelled/closed reader.
       */
      readerToPump.releaseLock();

      /*
       * Do NOT set `this._currentReader = null;` here.
       * `this._currentReader` is managed by `switchSource` and `close`.
       * If `switchSource` already set a new reader, this `finally` block
       * should not nullify the new reader.
       */
    }
  }

  close() {
    if (this._currentReader) {
      /*
       * Cancel the currently active reader.
       * This will make its `_pumpStream` loop exit via an error, leading to its `finally` block.
       */
      this._currentReader.cancel().catch(() => {}); // Catch cancel errors gracefully.
      this._currentReader.releaseLock(); // Ensure lock is released.
      this._currentReader = null; // Explicitly clear the current reader.
    }

    // Terminate the readable side of the TransformStream, indicating no more data will come.
    this._controller.terminate();
  }

  get switches() {
    return this._switches;
  }
}
