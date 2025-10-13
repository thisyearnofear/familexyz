import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Agent Card Skeleton
export const AgentCardSkeleton = () => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-12 rounded" />
      </div>
    </Card>
  );
};

// Family Stats Skeleton
export const FamilyStatsSkeleton = () => {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40 sm:w-48" />
          <Skeleton className="h-4 w-48 sm:w-64" />
        </div>
        <Skeleton className="h-6 sm:h-8 w-16 sm:w-20 rounded" />
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12 self-end sm:self-auto" />
        </div>
        <Skeleton className="h-3 w-full" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 space-y-2">
              <Skeleton className="h-4 w-16 mx-auto" />
              <Skeleton className="h-6 w-12 mx-auto" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Chat Interface Skeleton
export const ChatInterfaceSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
      
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <Skeleton className="h-12 w-48" />
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex space-x-2">
          <Skeleton className="flex-1 h-16" />
          <Skeleton className="h-16 w-16" />
        </div>
      </div>
    </div>
  );
};

// Platform Integration Skeleton
export const PlatformIntegrationSkeleton = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    </div>
  );
};

// Dashboard Overview Skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <AgentCardSkeleton />
      <FamilyStatsSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlatformIntegrationSkeleton />
      </div>
    </div>
  );
};