import { createFetch, createRetryOn } from '@devmoods/fetch';

export const fetch = createFetch({
  getRootUrl: () => '/api',
  timeout: 5000,
  retryOn: createRetryOn({
    max: 2,
    isRetriable: () => true,
    getDelay: (n) => 500 * n,
  }),
});
