import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz";

function getAuthHeaders(): HeadersInit {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('famile_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface MemoryStatus {
    enabled: boolean;
    service: 'cognee' | 'noop';
}

export interface RecallResult {
    enabled: boolean;
    userId?: string;
    query: string;
    results: string[];
    count: number;
    message?: string;
}

export function useMemoryStatus() {
    return useQuery<MemoryStatus>({
        queryKey: ['memory-status'],
        queryFn: () =>
            fetch(`${BASE_URL}/api/memory/status`).then(r => r.json()),
        staleTime: 30_000,
        retry: 1,
    });
}

export function useRecallMemory() {
    const queryClient = useQueryClient();
    return useMutation<RecallResult, Error, string>({
        mutationFn: async (query: string) => {
            const res = await fetch(`${BASE_URL}/api/memory/recall`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({ query }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['memory-recall'] });
        },
    });
}

export function useRememberMemory() {
    return useMutation<{ success: boolean; enabled: boolean; message?: string }, Error, { content: string; metadata?: Record<string, unknown> }>({
        mutationFn: async ({ content, metadata }) => {
            const res = await fetch(`${BASE_URL}/api/memory/remember`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({ content, metadata }),
            });
            return res.json();
        },
    });
}

export function useForgetMemory() {
    return useMutation<{ success: boolean; enabled: boolean; message?: string }, Error, void>({
        mutationFn: async () => {
            const res = await fetch(`${BASE_URL}/api/memory/forget`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
            });
            return res.json();
        },
    });
}

export function useImproveMemory() {
    return useMutation<{ success: boolean; enabled: boolean; message?: string }, Error, void>({
        mutationFn: async () => {
            const res = await fetch(`${BASE_URL}/api/memory/improve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
            });
            return res.json();
        },
    });
}
