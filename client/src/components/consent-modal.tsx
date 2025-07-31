import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConsentModalProps {
  open: boolean;
  onConsent: (accepted: boolean, scopes?: ConsentScopes) => void;
}
interface ConsentScopes {
  text: boolean;
  photo: boolean;
  audio: boolean;
}
const defaultScopes: ConsentScopes = { text: true, photo: false, audio: false };

const ConsentModal: React.FC<ConsentModalProps> = ({ open, onConsent }) => {
  const [scopes, setScopes] = React.useState<ConsentScopes>(defaultScopes);

  React.useEffect(() => {
    setScopes(defaultScopes);
  }, [open]);

  const handleChange = (key: keyof ConsentScopes) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setScopes({ ...scopes, [key]: e.target.checked });
  };

  const canAccept = scopes.text;

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
          <div className="mt-4">
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={scopes.text}
                disabled
                readOnly
              />
              <span>Text analysis (required)</span>
            </label>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={scopes.photo}
                onChange={handleChange("photo")}
              />
              <span>Photo analysis</span>
            </label>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={scopes.audio}
                onChange={handleChange("audio")}
              />
              <span>Audio analysis</span>
            </label>
          </div>
          <ul className="list-disc pl-5 mt-3 text-sm">
            <li>No messages are shared with third parties.</li>
            <li>You control your own data. All AI processing is for your benefit only.</li>
            <li>Metrics are used to display family wellbeing trends and insights.</li>
            <li>You may decline and use the app without analytics features.</li>
          </ul>
        </div>
        <DialogFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onConsent(false, scopes)}>
            Decline
          </Button>
          <Button onClick={() => onConsent(true, scopes)} disabled={!canAccept}>
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsentModal;