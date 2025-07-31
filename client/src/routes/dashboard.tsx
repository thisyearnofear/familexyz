import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const connectionOpportunities = [
  { title: "Family Game Night", description: "Friday, 7pm – Try a new board game together." },
  { title: "Mindful Walk", description: "Saturday morning – Tech-free walk in the park." },
  { title: "Story Swap", description: "Sunday, 4pm – Share family stories across generations." },
];

export default function Dashboard() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Family Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Family Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <span className="text-5xl font-semibold text-green-600">80%</span>
              <span className="text-gray-500">Strong connection</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Connection Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {connectionOpportunities.map((item, idx) => (
                <li key={idx}>
                  <span className="font-medium">{item.title}:</span> {item.description}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <Separator />
      <p className="mt-6 text-gray-500 text-sm">
        More insights, reminders, and personalized suggestions coming soon!
      </p>
    </div>
  );
}