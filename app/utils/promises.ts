interface PromiseWithResolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export function withResolvers<T>(): PromiseWithResolvers<T> {
  if (typeof Promise.withResolvers === 'function') {
    return Promise.withResolvers() as PromiseWithResolvers<T>;
  }

  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return {
    resolve,
    reject,
    promise,
  };
}