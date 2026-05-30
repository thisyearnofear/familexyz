'use client';

import type { Character } from "@/types/elizaos";

interface OverviewProps {
    character: Character;
}

export const Overview: React.FC<OverviewProps> = ({ character }) => {
    return (
        <div className="space-y-6 p-4">
            <div>
                <h2 className="text-2xl font-bold">{character.name}</h2>
                <p className="text-muted-foreground">
                    {character.modelProvider}
                </p>
            </div>
            <div className="bg-card border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Bio
                </h3>
                <p className="text-sm">
                    {Array.isArray(character.bio)
                        ? character.bio.join(" ")
                        : character.bio}
                </p>
            </div>
            {character.lore && character.lore.length > 0 && (
                <div className="bg-card border rounded-lg p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Lore
                    </h3>
                    <ul className="space-y-1">
                        {character.lore.map((item, i) => (
                            <li key={i} className="text-sm">
                                • {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div className="bg-card border rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Style Guide
                </h3>
                <div className="space-y-2">
                    {character.style?.all && (
                        <div>
                            <span className="text-xs text-muted-foreground">
                                All:
                            </span>
                            <p className="text-sm">
                                {character.style.all.join(", ")}
                            </p>
                        </div>
                    )}
                    {character.style?.chat && (
                        <div>
                            <span className="text-xs text-muted-foreground">
                                Chat:
                            </span>
                            <p className="text-sm">
                                {character.style.chat.join(", ")}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
