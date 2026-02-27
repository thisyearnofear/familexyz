import React, { Suspense, lazy } from "react";
import type { FamilyNetwork3DProps } from "./FamilyNetwork3D";

// Lazy load the 3D component to prevent loading Three.js on initial page load
const FamilyNetwork3DComponent = lazy(() => import("./FamilyNetwork3D"));

// Loading fallback while 3D component loads
const FamilyNetworkLoading = () => (
    <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <span className="text-sm text-white/60">Loading 3D Experience...</span>
        </div>
    </div>
);

// Exported lazy wrapper component
export const FamilyNetwork3DLazy: React.FC<FamilyNetwork3DProps> = (props) => {
    return (
        <Suspense fallback={<FamilyNetworkLoading />}>
            <FamilyNetwork3DComponent {...props} />
        </Suspense>
    );
};

export default FamilyNetwork3DLazy;
