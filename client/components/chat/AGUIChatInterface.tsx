'use client';

import React from "react";

export const AGUIChatInterface: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="max-w-md text-center space-y-4">
                <h2 className="text-lg font-semibold">
                    AG-UI Protocol Chat
                </h2>
                <p className="text-sm text-muted-foreground">
                    Standardized AI-User Interaction interface. Connect to a
                    running agent to begin chatting via the AG-UI protocol.
                </p>
            </div>
        </div>
    );
};
