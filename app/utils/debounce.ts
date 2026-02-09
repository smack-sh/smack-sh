export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return function executedFunction(...args: Parameters<T>) {
    /*
     * Note: This debounce implementation does not preserve the 'this' context of the original function.
     * If 'func' is a method and relies on 'this', it would need to be explicitly captured, e.g.,
     * `const context = this;` and then `func.apply(context, args);`.
     * For now, adhering to the original structure with `func(...args)`.
     */

    const later = () => {
      func(...args);

      /*
       * After the function executes, clear the timeout.
       * This indicates that the debounce cycle has completed and no timer is currently pending.
       * This placement prevents the scenario where 'timeout' is 'undefined' while 'func' is still running
       * (if 'func' is synchronous and long-running), which could lead to new debounce calls
       * not clearing a previous, still-executing debounce's state.
       */
      timeout = undefined;
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}
