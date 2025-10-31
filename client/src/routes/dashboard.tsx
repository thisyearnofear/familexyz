import { FamilyDashboard } from "@/components/FamilyDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <FamilyDashboard />
    </ErrorBoundary>
  );
}
