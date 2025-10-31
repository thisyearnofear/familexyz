import { EnhancedFamilyDashboard } from "@/components/EnhancedFamilyDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function EnhancedDashboard() {
  return (
    <ErrorBoundary>
      <EnhancedFamilyDashboard />
    </ErrorBoundary>
  );
}