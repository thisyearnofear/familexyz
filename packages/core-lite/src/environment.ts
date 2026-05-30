import { z } from "zod";
import { ModelProviderName } from "./types";

const MessageExampleSchema = z.object({
    user: z.string(),
    content: z.object({
        text: z.string(),
        action: z.string().optional(),
        source: z.string().optional(),
        url: z.string().optional(),
        attachments: z.array(z.any()).optional(),
    }).and(z.record(z.string(), z.unknown())),
});

const PluginSchema = z.object({
    name: z.string(),
    description: z.string(),
    actions: z.array(z.any()).optional(),
    providers: z.array(z.any()).optional(),
});

export const CharacterSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string(),
    system: z.string().optional(),
    modelProvider: z.nativeEnum(ModelProviderName),
    modelEndpointOverride: z.string().optional(),
    templates: z.record(z.string()).optional(),
    bio: z.union([z.string(), z.array(z.string())]),
    lore: z.array(z.string()),
    messageExamples: z.array(z.array(MessageExampleSchema)),
    postExamples: z.array(z.string()),
    topics: z.array(z.string()),
    adjectives: z.array(z.string()),
    knowledge: z.array(z.union([
        z.string(),
        z.object({ path: z.string(), shared: z.boolean().optional() }),
    ])).optional(),
    plugins: z.array(PluginSchema),
    settings: z.object({
        secrets: z.record(z.string()).optional(),
        voice: z.object({
            model: z.string().optional(),
            url: z.string().optional(),
        }).optional(),
        model: z.string().optional(),
        modelConfig: z.object({
            temperature: z.number().optional(),
            max_response_length: z.number().optional(),
        }).optional(),
        embeddingModel: z.string().optional(),
        veniceParameters: z.object({
            include_venice_system_prompt: z.boolean().optional(),
            enable_web_search: z.enum(["auto", "on", "off"]).optional(),
        }).optional(),
        /** Identity constraints for the hackathon */
        tone: z.string().optional(),
        format: z.string().optional(),
        banned: z.array(z.string()).optional(),
    }).optional(),
    style: z.object({
        all: z.array(z.string()),
        chat: z.array(z.string()),
        post: z.array(z.string()),
    }),
    extends: z.array(z.string()).optional(),
});

export type CharacterConfig = z.infer<typeof CharacterSchema>;

export function validateCharacterConfig(json: unknown): CharacterConfig {
    return CharacterSchema.parse(json);
}
