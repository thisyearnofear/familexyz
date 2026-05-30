export interface Character {
    id: string;
    name: string;
    modelProvider: string;
    clients: string[];
    plugins: string[];
    bio: string | string[];
    lore: string[];
    style: {
        all: string[];
        chat: string[];
        post: string[];
    };
    tone?: string;
    format?: string;
    banned?: string[];
    settings?: Record<string, any>;
    system?: string;
    templates?: Record<string, string>;
}
