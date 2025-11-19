import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import type { FamilyStats } from "@/types/family";

interface DashboardHeaderProps {
    familyStats?: FamilyStats;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ familyStats }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 text-white shadow-2xl"
        >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />

            <div className="relative z-10">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="text-4xl">👨‍👩‍👧‍👦</div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">
                                    Family Dashboard
                                </h1>
                                <p className="text-purple-100 mt-1">
                                    Your family connection hub
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Badge className="bg-white/20 text-white border-white/30">
                                <span className="mr-2">🎯</span>
                                {familyStats?.total || 0} Total Interactions
                            </Badge>
                            <Badge className="bg-white/20 text-white border-white/30">
                                <span className="mr-2">💚</span>
                                {familyStats?.positive || 0} Positive
                            </Badge>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white/70 hover:text-white hover:bg-white/10"
                        >
                            <Bell className="w-4 h-4" />
                        </Button>

                        {familyStats?.latestTransactionId && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={() => window.open(`https://hashscan.io/testnet/transaction/${familyStats.latestTransactionId}`, '_blank')}
                            >
                                <span className="mr-2">⛓️</span>
                                View on HashScan
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
