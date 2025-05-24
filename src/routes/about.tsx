import { createFileRoute, Link } from "@tanstack/react-router";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "../components/Button";

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});

function RouteComponent() {
  const { authenticated, login } = usePrivy();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 text-gray-800">
      <h1 className="mb-6 text-center text-4xl font-bold text-purple-700">
        Everything Agora
      </h1>

      <p className="mb-8 text-center text-xl text-gray-600">
        A soft protocol for vouching, recognition, and shared coordination.
      </p>

      <div className="space-y-6 text-lg">
        <p>
          Everything Agora is a live experiment in decentralized commerce—a
          marketplace of free offerings where participants give time, skills, or
          support without asking for anything in return. After receiving help,
          others can vouch—leaving a written review that is recorded onchain as
          an attestation.
        </p>

        <p>
          Each vouch is a fulfilled promise—an onchain signal of trust in
          motion. Not extracted, but earned through presence and intention.
        </p>

        <p>
          Inspired by the commitment pooling experiment and Ori Shimony’s
          research on peer-to-peer commerce, Everything Agora asks:
        </p>

        <ul className="list-disc space-y-2 pl-6 italic">
          <li>What if trade wasn’t about payment, but public trust?</li>
          <li>What if coordination didn’t require platforms, only promises?</li>
        </ul>

        <p>
          The result is a shared ledger of gratitude—an emergent reputation
          layer built from people showing up for each other.
        </p>
      </div>

      <div className="mt-12 flex justify-center">
        {" "}
        {/* Added container for the button */}
        {!authenticated ? (
          <Button variant="primary" onClick={login}>
            Login to Participate
          </Button>
        ) : (
          <Link to="/">
            <Button variant="primary">Vouch for Someone</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
