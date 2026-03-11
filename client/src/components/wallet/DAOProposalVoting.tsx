import React, { useState, useEffect } from "react";
import { 
  Vote, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  ThumbsUp,
  ThumbsDown,
  Users,
  ExternalLink,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Proposal {
  id: number;
  title: string;
  description: string;
  votesFor: number;
  votesAgainst: number;
  quorum: number;
  status: "active" | "passed" | "rejected" | "executed";
  proposer: string;
  deadline: number;
}

interface DAOVotingProps {
  contractId: string;
  accountId: string;
  isAdmin?: boolean;
  onVote: (proposalId: number, support: boolean) => Promise<void>;
  onExecute?: (proposalId: number) => Promise<void>;
}

export const DAOProposalVoting: React.FC<DAOVotingProps> = ({
  contractId,
  accountId,
  isAdmin = false,
  onVote,
  onExecute,
}) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [votingProposalId, setVotingProposalId] = useState<number | null>(null);

  const fetchProposals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dao/${contractId}/proposals`);
      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contractId) {
      fetchProposals();
    }
  }, [contractId]);

  const handleCreateProposal = async () => {
    if (!newTitle || !newDescription) return;

    setIsCreating(true);
    try {
      await fetch(`/api/dao/${contractId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          proposer: accountId,
        }),
      });
      setNewTitle("");
      setNewDescription("");
      setShowCreateForm(false);
      fetchProposals();
    } catch (error) {
      console.error("Failed to create proposal:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleVote = async (proposalId: number, support: boolean) => {
    setVotingProposalId(proposalId);
    try {
      await onVote(proposalId, support);
      fetchProposals();
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setVotingProposalId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-700";
      case "passed":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "executed":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTimeRemaining = (deadline: number) => {
    const now = Date.now();
    const remaining = deadline - now;
    if (remaining <= 0) return "Ended";
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const calculatePercentage = (forVotes: number, againstVotes: number) => {
    const total = forVotes + againstVotes;
    if (total === 0) return 0;
    return (forVotes / total) * 100;
  };

  return (
    <Card className="w-full bg-white border-purple-100">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Vote className="w-5 h-5 text-purple-600" />
            Governance Proposals
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Proposal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Create Proposal Form */}
        {showCreateForm && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg space-y-3">
            <h3 className="font-medium">Create New Proposal</h3>
            <div>
              <Label>Title</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Proposal title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe your proposal..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProposal}
                disabled={isCreating || !newTitle || !newDescription}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Submit Proposal"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Proposals List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            Loading proposals...
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Vote className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No proposals yet</p>
            <p className="text-sm mt-1">Create the first proposal for your family</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{proposal.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                  </div>
                  <Badge className={getStatusColor(proposal.status)}>
                    {proposal.status}
                  </Badge>
                </div>

                {/* Voting Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <ThumbsUp className="w-4 h-4" />
                      {proposal.votesFor}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <ThumbsDown className="w-4 h-4" />
                      {proposal.votesAgainst}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${calculatePercentage(proposal.votesFor, proposal.votesAgainst)}%` }}
                    />
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${100 - calculatePercentage(proposal.votesFor, proposal.votesAgainst)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{calculatePercentage(proposal.votesFor, proposal.votesAgainst).toFixed(1)}% For</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getTimeRemaining(proposal.deadline)}
                    </span>
                  </div>
                </div>

                {/* Vote Buttons */}
                {proposal.status === "active" && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleVote(proposal.id, true)}
                      disabled={votingProposalId === proposal.id}
                    >
                      {votingProposalId === proposal.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Vote For
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleVote(proposal.id, false)}
                      disabled={votingProposalId === proposal.id}
                    >
                      {votingProposalId === proposal.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Vote Against
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Execute Button for Passed Proposals */}
                {proposal.status === "passed" && isAdmin && onExecute && (
                  <Button
                    size="sm"
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => onExecute(proposal.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Execute Proposal
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
