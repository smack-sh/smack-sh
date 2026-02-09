export function bufferWatchEvents<T extends unknown[]>(timeInMs: number, cb: (events: T[]) => unknown) {
  let timeoutId: number | undefined;
  let events: T[] = [];

  // keep track of the processing of the previous batch so we can wait for it
  let processing: Promise<unknown> = Promise.resolve();

  const scheduleBufferTick = () => {
    timeoutId = setTimeout(async () => {
      /*
       * Fixed `self.setTimeout` to `setTimeout` for broader compatibility
       * we wait until the previous batch is entirely processed so events are processed in order
       */
      await processing;

      if (events.length > 0) {
        const eventsToProcess = events; // Capture the events for the current batch
        events = []; // Clear the `events` array for new incoming events immediately

        /*
         * Chain the new processing promise onto the existing `processing` promise
         * This ensures sequential execution of callbacks.
         */
        processing = processing.then(async () => {
          try {
            // Ensure the callback's execution is awaited, whether it returns a Promise or a synchronous value.
            await Promise.resolve(cb(eventsToProcess));
          } catch (error) {
            console.error('Error processing buffered events:', error);

            // Log the error but do not re-throw, allowing subsequent batches to be processed.
          }
        });
      }

      timeoutId = undefined;

      // `events` is already cleared for the next batch inside the `if` block.
    }, timeInMs);
  };

  return (...args: T) => {
    events.push(args);

    if (!timeoutId) {
      scheduleBufferTick();
    }
  };
}
