/**
 * Creates a function that samples calls at regular intervals and captures trailing calls.
 * - Drops calls that occur between sampling intervals (only the last one in an interval is considered for trailing)
 * - Takes one call per sampling interval if available (executes immediately if outside an interval)
 * - Captures the last call as a "trailing" call if multiple calls were made within an interval, and no immediate call occurred.
 *
 * @param fn The function to sample
 * @param sampleInterval How often to sample calls (in ms)
 * @returns The sampled function, which will have a `void` return type as the original function's execution is asynchronous.
 */
export function createSampler<T extends (...args: any[]) => any>(
  fn: T,
  sampleInterval: number,
): (...args: Parameters<T>) => void {
  let lastArgs: Parameters<T> | null = null;
  let lastTime = 0; // The time when the last *sampled* (executed) call occurred.
  let timeout: NodeJS.Timeout | null = null; // Timer for the trailing call.

  const sampled = function (this: any, ...args: Parameters<T>): void {
    const now = Date.now();
    lastArgs = args; // Always store the latest arguments received, for a potential trailing call.

    /*
     * If we are within the current sampling interval (i.e., less than `sampleInterval` ms
     * has passed since the last *executed* call).
     */
    if (now - lastTime < sampleInterval) {
      /*
       * If no trailing call is currently scheduled, schedule one.
       * If one is already scheduled, we just updated `lastArgs`, so it will use the newest args.
       */
      if (!timeout) {
        timeout = setTimeout(
          () => {
            timeout = null; // Clear the timeout reference
            lastTime = Date.now(); // Update lastTime, as this trailing call effectively starts a new interval.

            if (lastArgs) {
              // Execute the function with the last captured arguments.
              fn.apply(this, lastArgs);
              lastArgs = null; // Clear lastArgs after execution.
            }
          },
          sampleInterval - (now - lastTime), // Wait for the remaining time of the current interval.
        );
      }

      return; // The current call is either dropped or becomes the `lastArgs` for a scheduled trailing call.
    }

    /*
     * If we are outside the interval (i.e., `sampleInterval` ms or more has passed
     * since the last *executed* call).
     * This call should be executed immediately.
     * Any previously scheduled trailing call must be cleared as this immediate call "takes its place".
     */
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    lastTime = now; // Update lastTime to now, as this call is being executed immediately and starts a new interval.
    fn.apply(this, args); // Execute the function immediately with the current arguments.
    lastArgs = null; // Clear lastArgs as it was just handled.
  };

  return sampled;
}
