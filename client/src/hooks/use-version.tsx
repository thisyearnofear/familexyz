import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

interface VersionInfo {
  current: string;
  latest: string;
  hasUpdate: boolean;
  releaseNotes?: string;
}

interface FamilyUpdateInfo {
  version: string;
  features: string[];
  improvements: string[];
  releaseDate: string;
}

export default function useVersion() {
    const [versionInfo] = useState<VersionInfo | null>(null);
    const { toast } = useToast();

    const checkForFamilyUpdates = async (): Promise<FamilyUpdateInfo | null> => {
        try {
            // Check for family-specific updates from our backend
            const response = await fetch('/api/family/updates/check');
            if (!response.ok) {
                throw new Error('Failed to check for updates');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to check for family updates:', error);
            return null;
        }
    };

    const getFamilyProductUpdates = async (): Promise<void> => {
        const updateInfo = await checkForFamilyUpdates();
        
        if (updateInfo) {
            // Show family-specific update notification
            toast({
                title: `FamilyXYZ v${updateInfo.version} Available! 🎉`,
                description: `New features: ${updateInfo.features.slice(0, 2).join(', ')}${updateInfo.features.length > 2 ? '...' : ''}`,
                action: (
                    <ToastAction 
                        altText="View updates"
                        onClick={() => {
                            // Open update details modal or navigate to changelog
                            window.open('/updates', '_blank');
                        }}
                    >
                        View Details
                    </ToastAction>
                ),
                duration: 10000, // Show for 10 seconds
            });
        }
    };

    useEffect(() => {
        // Check for family product updates on mount
        getFamilyProductUpdates();
        
        // Set up periodic checking (every 24 hours)
        const interval = setInterval(() => {
            getFamilyProductUpdates();
        }, 24 * 60 * 60 * 1000); // 24 hours

        return () => clearInterval(interval);
    }, []);

    return {
        versionInfo,
        checkForUpdates: getFamilyProductUpdates,
        isUpdateAvailable: versionInfo?.hasUpdate || false
    };
}
