import { EnhancedFamilyDashboard } from "@/components/EnhancedFamilyDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <EnhancedFamilyDashboard />
    </ErrorBoundary>
  );
}
