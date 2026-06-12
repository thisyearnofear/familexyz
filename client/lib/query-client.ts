import { QueryClient } from '@tanstack/react-query';

let browserQueryClient: QueryClient | null = null;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          retry: 2,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          retry: 2,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  return browserQueryClient;
}
