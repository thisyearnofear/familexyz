import { ModularDashboard } from "@/components/ModularDashboard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <ModularDashboard />
    </ErrorBoundary>
  );
}
