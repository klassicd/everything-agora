import { Button } from "./button";

interface LandingContentProps {
  onLogin: () => void;
}

export function LandingContent({ onLogin }: LandingContentProps) {
  return (
    <div>
      <p className="mb-4 text-gray-700">
        A space for peer-to-peer exchange of skills, services, support and
        recognition.
      </p>
      {/* You can add more introductory text or elements here */}
      <Button onClick={onLogin} variant="primary">
        Join with Privy
      </Button>
    </div>
  );
}
