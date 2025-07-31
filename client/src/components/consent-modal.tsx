import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConsentModalProps {
  open: boolean;
  onConsent: (accepted: boolean) => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({ open, onConsent }) => {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Family Data Processing Consent</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-gray-700">
          <p>
            To provide personalized insights and support, Family Agents
            processes your messages and interaction data using privacy-first AI.
            No personal data is shared externally. You can revoke consent at any time.
          </p>
          <ul className="list-disc pl-5 mt-3 text-sm">
            <li>No messages are shared with third parties.</li>
            <li>You control your own data. All AI processing is for your benefit only.</li>
            <li>Metrics are used to display family wellbeing trends and insights.</li>
            <li>You may decline and use the app without analytics features.</li>
          </ul>
        </div>
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onConsent(false)}>
            Decline
          </Button>
          <Button onClick={() => onConsent(true)}>
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsentModal;