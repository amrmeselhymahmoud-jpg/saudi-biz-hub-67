import { lazy, ComponentType } from 'react';

export const lazyLoadWithRetry = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): ReturnType<typeof lazy> => {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (attemptsLeft: number) => {
        importFunc()
          .then(resolve)
          .catch((error) => {
            if (attemptsLeft === 1) {
              reject(error);
              return;
            }

            setTimeout(() => {
              attemptLoad(attemptsLeft - 1);
            }, interval);
          });
      };

      attemptLoad(retries);
    });
  });
};

export const preloadComponent = (importFunc: () => Promise<any>) => {
  const promise = importFunc();
  return () => promise;
};
