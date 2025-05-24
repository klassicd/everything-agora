import { Link } from "@tanstack/react-router";
import { Button } from "./Button";

interface LandingContentProps {
  onLogin: () => void;
}

export function LandingContent({ onLogin }: LandingContentProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center md:flex-row md:space-x-6 md:text-left">
      <img
        src="/images/everything-agora-logo.png"
        alt="Everything Agora Logo"
        className="mb-4 h-32 w-auto md:mb-0 md:h-40"
      />
      <div>
        <p className="mb-4 text-lg text-gray-700">
          A space for peer-to-peer exchange of skills, services, support and
          recognition.
        </p>
        <div className="flex items-center justify-center md:justify-start">
          <Button onClick={onLogin} variant="primary">
            Join Community
          </Button>
          <Link to="/about" className="ml-4">
            <Button variant="secondary">Learn More</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
