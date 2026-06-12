import { useQuery } from '@tanstack/react-query';

export interface CatalogAgent {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    tier_required: string;
    price_override: number | null;
    metadata: string | null;
}

export function useMarketplaceAgents(category?: string) {
    return useQuery<{ agents: CatalogAgent[] }>({
        queryKey: ['marketplace-agents', category],
        queryFn: () => {
            const params = category ? `?category=${category}` : "";
            return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz"}/api/marketplace/agents${params}`).then(r => r.json());
        },
        staleTime: 5 * 60_000,
    });
}

export function useMarketplaceAgent(slug: string) {
    return useQuery({
        queryKey: ['marketplace-agent', slug],
        queryFn: () => {
            return fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz"}/api/marketplace/agents/${slug}`).then(r => r.json());
        },
        enabled: !!slug,
        staleTime: 5 * 60_000,
    });
}
