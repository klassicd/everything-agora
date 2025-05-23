import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "../components/Button";

const baseUrl = import.meta.env.VITE_API_URL;

interface LeaderboardEntry {
  nickname: string;
  address: string;
  privyId: string;
  totalAttestationsReceived: number;
}

async function fetchLeaderboardData(
  token: string | null,
): Promise<LeaderboardEntry[]> {
  if (!token) {
    throw new Error("Authentication token not available.");
  }
  const response = await fetch(`${baseUrl}/leaderboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard data");
  }
  return response.json();
}

export const Route = createFileRoute("/leaderboard")({
  component: Leaderboard,
});

function Leaderboard() {
  const { authenticated, login, getAccessToken } = usePrivy();

  const {
    data: leaderboardData,
    isLoading,
    isError,
    error,
  } = useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchLeaderboardData(token);
    },
    enabled: authenticated,
  });

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-lg p-4 text-center">
        <p className="mb-4">Please log in to view the leaderboard.</p>
        <Button onClick={login} variant="primary">
          Login with Privy
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg p-4 text-center">
        Loading leaderboard...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-lg p-4 text-center text-red-500">
        Error fetching leaderboard: {error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <h2 className="mb-6 text-left text-2xl font-semibold">Leaderboard</h2>
      {leaderboardData && leaderboardData.length === 0 ? (
        <p className="text-center text-gray-500">
          The leaderboard is currently empty.
        </p>
      ) : leaderboardData && leaderboardData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Rank
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Seller
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Reviews Received
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {leaderboardData.map((entry, index) => (
                <tr key={entry.privyId}>
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                    <Link
                      to="/profile/$address"
                      params={{ address: entry.address }}
                      className="text-blue-600 hover:underline"
                    >
                      {entry.nickname}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {entry.totalAttestationsReceived}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
