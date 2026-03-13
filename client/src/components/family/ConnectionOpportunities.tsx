import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ConnectionOpportunity } from "@/types/family";

interface ConnectionOpportunitiesProps {
  opportunities?: ConnectionOpportunity[];
}

const defaultOpportunities: ConnectionOpportunity[] = [
  { 
    title: "Family Game Night", 
    description: "Friday, 7pm – Try a new board game together.",
    category: "activity",
    difficulty: "easy"
  },
  { 
    title: "Mindful Walk", 
    description: "Saturday morning – Tech-free walk in the park.",
    category: "activity", 
    difficulty: "easy"
  },
  { 
    title: "Story Swap", 
    description: "Sunday, 4pm – Share family stories across generations.",
    category: "conversation",
    difficulty: "medium"
  },
];

const getCategoryColor = (category: ConnectionOpportunity['category']) => {
  switch (category) {
    case 'activity':
      return 'bg-blue-100 text-blue-800';
    case 'conversation':
      return 'bg-green-100 text-green-300';
    case 'tradition':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-muted text-foreground';
  }
};

const getDifficultyColor = (difficulty: ConnectionOpportunity['difficulty']) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'challenging':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-muted text-foreground';
  }
};

export const ConnectionOpportunities = ({ 
  opportunities = defaultOpportunities 
}: ConnectionOpportunitiesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Opportunities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {opportunities.map((opportunity, index: number) => (
          <div
            key={index}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm">{opportunity.title}</h4>
              <div className="flex gap-1">
                {opportunity.category && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getCategoryColor(opportunity.category)}`}
                  >
                    {opportunity.category}
                  </Badge>
                )}
                {opportunity.difficulty && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getDifficultyColor(opportunity.difficulty)}`}
                  >
                    {opportunity.difficulty}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {opportunity.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};