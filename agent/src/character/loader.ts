/**
 * Character Loading Module
 * 
 * Handles loading, parsing, and validating character configurations
 * from various sources: files, URLs, and on-chain.
 * 
 * Follows DRY principle: single source for character loading logic.
 */

import {
    type Character,
    defaultCharacter,
    elizaLogger,
    stringToUuid,
    validateCharacterConfig,
} from "@elizaos/core";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse command-line arguments for character paths
 */
export async function parseArguments(): Promise<{
    character?: string;
    characters?: string;
}> {
    try {
        const yargs = (await import("yargs")).default;
        const { hideBin } = await import("yargs/helpers");
        
        return yargs(hideBin(process.argv))
            .option("character", {
                type: "string",
                description: "Path to the character JSON file",
            })
            .option("characters", {
                type: "string",
                description: "Comma separated list of paths to character JSON files",
            })
            .parseSync();
    } catch (error) {
        elizaLogger.error("Error parsing arguments:", error);
        return {};
    }
}

/**
 * Try to load a file and return its contents
 */
function tryLoadFile(filePath: string): string | null {
    try {
        return fs.readFileSync(filePath, "utf8");
    } catch {
        return null;
    }
}

/**
 * Merge two character configurations
 */
function mergeCharacters(base: Character, child: Character): Character {
    const mergeObjects = (baseObj: any, childObj: any): any => {
        const result: any = {};
        const keys = new Set([
            ...Object.keys(baseObj || {}),
            ...Object.keys(childObj || {}),
        ]);
        keys.forEach((key) => {
            if (
                typeof baseObj[key] === "object" &&
                typeof childObj[key] === "object" &&
                !Array.isArray(baseObj[key]) &&
                !Array.isArray(childObj[key])
            ) {
                result[key] = mergeObjects(baseObj[key], childObj[key]);
            } else if (
                Array.isArray(baseObj[key]) ||
                Array.isArray(childObj[key])
            ) {
                result[key] = [...(baseObj[key] || []), ...(childObj[key] || [])];
            } else {
                result[key] = childObj[key] !== undefined ? childObj[key] : baseObj[key];
            }
        });
        return result;
    };
    return mergeObjects(base, child);
}

/**
 * Check if array contains only strings
 */
function isAllStrings(arr: unknown[]): boolean {
    return Array.isArray(arr) && arr.every((item) => typeof item === "string");
}

/**
 * Handle plugin importing from string names
 */
async function handlePluginImporting(plugins: string[]): Promise<any[]> {
    if (!plugins || plugins.length === 0) {
        return [];
    }
    
    elizaLogger.info("Plugins are: ", plugins);
    const importedPlugins = await Promise.all(
        plugins.map(async (plugin) => {
            try {
                const importedPlugin = await import(plugin);
                const functionName =
                    plugin
                        .replace("@elizaos/plugin-", "")
                        .replace(/-./g, (x) => x[1].toUpperCase()) + "Plugin";
                return importedPlugin.default || importedPlugin[functionName];
            } catch (importError) {
                elizaLogger.error(`Failed to import plugin: ${plugin}`, importError);
                return [];
            }
        }),
    );
    return importedPlugins;
}

/**
 * Convert JSON object to Character with validation
 */
async function jsonToCharacter(filePath: string, character: any): Promise<Character> {
    if (!character.id) {
        character.id = stringToUuid(character.name.toLowerCase());
    }

    validateCharacterConfig(character);

    const characterId = character.id;
    const characterPrefix = `CHARACTER.${characterId
        .toUpperCase()
        .replace(/ /g, "_")}.`;
    
    const characterSettings = Object.entries(process.env)
        .filter(([key]) => key.startsWith(characterPrefix))
        .reduce((settings, [key, value]) => {
            const settingKey = key.slice(characterPrefix.length);
            return { ...settings, [settingKey]: value };
        }, {} as Record<string, string>);
        
    if (Object.keys(characterSettings).length > 0) {
        character.settings = character.settings || {};
        character.settings.secrets = {
            ...characterSettings,
            ...character.settings.secrets,
        };
    }
    
    character.plugins = await handlePluginImporting(character.plugins);
    
    if (character.extends) {
        elizaLogger.info(`Merging ${character.name} character with parent characters`);
        for (const extendPath of character.extends) {
            const baseCharacter = await loadCharacter(
                path.resolve(path.dirname(filePath), extendPath)
            );
            character = mergeCharacters(baseCharacter, character);
            elizaLogger.info(`Merged ${character.name} with ${baseCharacter.name}`);
        }
    }
    return character;
}

/**
 * Load character from a file path
 */
async function loadCharacter(filePath: string): Promise<Character> {
    const content = tryLoadFile(filePath);
    if (!content) {
        throw new Error(`Character file not found: ${filePath}`);
    }
    const character = JSON.parse(content);
    return jsonToCharacter(filePath, character);
}

/**
 * Load character trying multiple path resolutions
 */
export async function loadCharacterTryPath(characterPath: string): Promise<Character> {
    let content: string | null = null;
    let resolvedPath = "";

    const pathsToTry = [
        characterPath,
        path.resolve(process.cwd(), characterPath),
        path.resolve(process.cwd(), "agent", characterPath),
        path.resolve(__dirname, characterPath),
        path.resolve(__dirname, "characters", path.basename(characterPath)),
        path.resolve(__dirname, "../characters", path.basename(characterPath)),
        path.resolve(__dirname, "../../characters", path.basename(characterPath)),
    ];

    elizaLogger.info(
        "Trying paths:",
        pathsToTry.map((p) => ({ path: p, exists: fs.existsSync(p) }))
    );

    for (const tryPath of pathsToTry) {
        content = tryLoadFile(tryPath);
        if (content !== null) {
            resolvedPath = tryPath;
            break;
        }
    }

    if (content === null) {
        elizaLogger.error(
            `Error loading character from ${characterPath}: File not found in any expected location`
        );
        pathsToTry.forEach((p) => elizaLogger.error(` - ${p}`));
        throw new Error(
            `Character file not found: ${characterPath}`
        );
    }
    
    const character: Character = await loadCharacter(resolvedPath);
    elizaLogger.info(`Successfully loaded character from: ${resolvedPath}`);
    return character;
}

/**
 * Convert comma-separated string to array
 */
function commaSeparatedStringToArray(commaSeparated: string): string[] {
    return commaSeparated?.split(",").map((value) => value.trim()) || [];
}

/**
 * Read characters from storage directory
 */
async function readCharactersFromStorage(characterPaths: string[]): Promise<string[]> {
    try {
        const uploadDir = path.join(process.cwd(), "data", "characters");
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const fileNames = await fs.promises.readdir(uploadDir);
        fileNames.forEach((fileName) => {
            characterPaths.push(path.join(uploadDir, fileName));
        });
    } catch (err: any) {
        elizaLogger.error(`Error reading directory: ${err.message}`);
    }
    return characterPaths;
}

/**
 * Check if remote URLs are valid
 */
const hasValidRemoteUrls = () =>
    process.env.REMOTE_CHARACTER_URLS &&
    process.env.REMOTE_CHARACTER_URLS !== "" &&
    process.env.REMOTE_CHARACTER_URLS.startsWith("http");

/**
 * Load characters from a remote URL
 */
async function loadCharactersFromUrl(url: string): Promise<Character[]> {
    try {
        const response = await fetch(url);
        const responseJson = await response.json();

        let characters: Character[] = [];
        if (Array.isArray(responseJson)) {
            characters = await Promise.all(
                responseJson.map((character) => jsonToCharacter(url, character))
            );
        } else {
            const character = await jsonToCharacter(url, responseJson);
            characters.push(character);
        }
        return characters;
    } catch (e) {
        elizaLogger.error(`Error loading character(s) from ${url}: ${e}`);
        process.exit(1);
    }
}

/**
 * Load character from on-chain JSON
 */
export async function loadCharacterFromOnchain(): Promise<Character[]> {
    const onchainJson = process.env.ONCHAIN_JSON || null;
    if (!onchainJson) return [];

    try {
        const character = JSON.parse(onchainJson);
        validateCharacterConfig(character);

        if (!character.id) {
            character.id = stringToUuid(character.name.toLowerCase());
        }
        
        const characterId = character.id;
        const characterPrefix = `CHARACTER.${characterId
            .toUpperCase()
            .replace(/ /g, "_")}.`;

        const characterSettings = Object.entries(process.env)
            .filter(([key]) => key.startsWith(characterPrefix))
            .reduce((settings, [key, value]) => {
                const settingKey = key.slice(characterPrefix.length);
                settings[settingKey] = value;
                return settings;
            }, {} as Record<string, string>);

        if (Object.keys(characterSettings).length > 0) {
            character.settings = character.settings || {};
            character.settings.secrets = {
                ...characterSettings,
                ...character.settings.secrets,
            };
        }

        if (isAllStrings(character.plugins)) {
            elizaLogger.info("Plugins are: ", character.plugins);
            const importedPlugins = await Promise.all(
                character.plugins.map(async (plugin) => {
                    const importedPlugin = await import(plugin);
                    return importedPlugin.default;
                })
            );
            character.plugins = importedPlugins;
        }

        elizaLogger.info(`Successfully loaded character from onchain`);
        return [character];
    } catch (e) {
        elizaLogger.error(`Error parsing character from onchain: ${e}`);
        process.exit(1);
    }
}

/**
 * Main function to load all characters
 */
export async function loadCharacters(charactersArg: string): Promise<Character[]> {
    let characterPaths = commaSeparatedStringToArray(charactersArg);

    if (process.env.USE_CHARACTER_STORAGE === "true") {
        characterPaths = await readCharactersFromStorage(characterPaths);
    }

    const loadedCharacters: Character[] = [];

    if (characterPaths?.length > 0) {
        for (const characterPath of characterPaths) {
            const character: Character = await loadCharacterTryPath(characterPath);
            loadedCharacters.push(character);
        }
    }

    if (hasValidRemoteUrls()) {
        elizaLogger.info("Loading characters from remote URLs");
        const characterUrls = commaSeparatedStringToArray(process.env.REMOTE_CHARACTER_URLS!);
        for (const characterUrl of characterUrls) {
            const characters = await loadCharactersFromUrl(characterUrl);
            loadedCharacters.push(...characters);
        }
    }

    if (loadedCharacters.length === 0) {
        elizaLogger.info("No characters found, using default character");
        loadedCharacters.push(defaultCharacter);
    }

    return loadedCharacters;
}

export { jsonToCharacter };