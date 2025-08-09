import { useEffect } from "react";
import { useToast } from "./use-toast";
import info from "@/lib/info.json";
import semver from "semver";
import { ToastAction } from "@/components/ui/toast";
import { NavLink } from "react-router";

export default function useVersion() {
    const { toast } = useToast();

    async function getFamilyProductUpdates() {
        // For now, we'll disable version checking since this is a family product
        // In the future, you could check your own release endpoint:
        // const apiUrl = `https://api.your-family-product.com/releases/latest`;
        
        try {
            // Placeholder for future family product update checking
            // const response = await fetch(apiUrl);
            // const data = await response.json();
            // return data.version;
            return null;
        } catch (error) {
            console.log("Family product update check disabled");
            return null;
        }
    }

    const checkForFamilyUpdates = async () => {
        try {
            // Disabled for now - no need to show Eliza OS updates to family users
            // const latestVersion = await getFamilyProductUpdates();
            // const currentVersion = info?.version;
            
            // Future: Show family-specific product updates
            // if (latestVersion && currentVersion && semver.gt(latestVersion, currentVersion)) {
            //     toast({
            //         variant: "default",
            //         title: `New family features available in v${latestVersion}`,
            //         description: "Update to get the latest family connection tools.",
            //         action: (
            //             <NavLink to="/updates" target="_blank">
            //                 <ToastAction altText="Learn More">
            //                     Learn More
            //                 </ToastAction>
            //             </NavLink>
            //         ),
            //     });
            // }
        } catch (error) {
            // Silently handle - no need to show errors to family users
            console.log("Family product update check completed");
        }
    };

    useEffect(() => {
        // Disabled for now - family users don't need Eliza OS version notifications
        // checkForFamilyUpdates();
    }, []);

    return null;
}
