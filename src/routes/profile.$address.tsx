import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/button"; // Assuming you have this
import { PencilIcon } from "@heroicons/react/24/outline"; // Or solid, adjust as needed

const baseUrl = import.meta.env.VITE_API_URL;

interface AttestationReceived {
  reviewText: string;
  buyerNickname: string;
  uid: string;
  createdAt: string;
}

interface AttestationGiven {
  reviewText: string;
  sellerNickname: string;
  uid: string;
  createdAt: string;
}

interface ProfileData {
  nickname: string;
  attestationsReceived: AttestationReceived[];
  attestationsGiven: AttestationGiven[];
  address: string; // Assuming API returns the address for clarity, or use param
}

async function fetchProfileData(
  address: string,
  token: string | null,
): Promise<ProfileData> {
  if (!token) {
    throw new Error("Authentication token not available.");
  }
  if (!address) {
    throw new Error("Profile address not available.");
  }
  const response = await fetch(`${baseUrl}/profiles/${address}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Profile not found.");
    }
    throw new Error("Failed to fetch profile data");
  }
  return response.json();
}

export const Route = createFileRoute("/profile/$address")({
  component: ProfilePage,
});

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function ProfilePage() {
  const { address } = useParams({ from: "/profile/$address" });
  const { authenticated, login, getAccessToken } = usePrivy();
  const { wallets } = useWallets();

  const [activeTab, setActiveTab] = useState<"received" | "given">("received");

  const {
    data: profileData,
    isLoading,
    isError,
    error,
  } = useQuery<ProfileData, Error>({
    queryKey: ["profile", address],
    queryFn: async () => {
      const token = await getAccessToken();
      return fetchProfileData(address, token);
    },
    enabled: authenticated && !!address,
    retry: false,
  });

  const currentUserAddress = wallets[0]?.address;
  const isOwnProfile =
    authenticated &&
    !!currentUserAddress &&
    !!address &&
    currentUserAddress.toLowerCase() === address.toLowerCase();

  const tabs = [
    { name: "Reviews Received", value: "received" as const },
    { name: "Reviews Given", value: "given" as const },
  ];

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-lg p-4 text-center">
        <p className="mb-4">Please log in to view profiles.</p>
        <Button onClick={login} variant="primary">
          Login with Privy
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg p-4 text-center">Loading profile...</div>
    );
  }

  // Show a short, sweet invite to set up a nickname if it's your own missing profile
  if (isError && error?.message === "Profile not found." && isOwnProfile) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="mb-4">
          Hey there! You don’t have a profile yet. Pick a nickname so people can
          vouch for you and see your stats.
        </p>
        <Link to="/settings" className="text-indigo-600 hover:underline">
          Set up my profile
        </Link>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-lg p-4 text-center text-red-500">
        Error: {error?.message || "Could not load profile."}
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="mx-auto max-w-lg p-4 text-center">
        Profile data not available.
      </div>
    );
  }

  const stats = [
    {
      name: "Reviews Received",
      stat: profileData.attestationsReceived.length.toString(),
    },
    {
      name: "Reviews Given",
      stat: profileData.attestationsGiven.length.toString(),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          {/* Placeholder for Avatar if you add one */}
          {/* <img className="h-16 w-16 rounded-full mr-4" src="/path-to-avatar.png" alt="User avatar" /> */}
          <h1 className="text-3xl font-bold text-gray-900">
            {profileData.nickname || "User Profile"}
          </h1>
        </div>
        {isOwnProfile && (
          <Link
            to="/settings"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
          >
            <PencilIcon className="mr-2 h-5 w-5" aria-hidden="true" />
            Edit Profile
          </Link>
        )}
      </div>

      {/* Stats Pill Row */}
      <div className="mb-8">
        {/* <h3 className="text-base font-semibold text-gray-900">Activity</h3> */}
        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {stats.map((item) => (
            <div
              key={item.name}
              className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6"
            >
              <dt className="truncate text-sm font-medium text-gray-500">
                {item.name}
              </dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                {item.stat}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Tabs Section */}
      <div className="mb-8">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-base focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
            value={activeTab}
            onChange={(e) =>
              setActiveTab(e.target.value as "received" | "given")
            }
          >
            {tabs.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.name}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={classNames(
                    tab.value === activeTab
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                    "cursor-pointer border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap",
                  )}
                  aria-current={tab.value === activeTab ? "page" : undefined}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      <div>
        {activeTab === "received" && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Reviews Received</h2>
            {profileData.attestationsReceived.length === 0 ? (
              <p className="text-gray-500">No reviews received yet.</p>
            ) : (
              <ul className="space-y-4">
                {profileData.attestationsReceived.map((attestation) => (
                  <li
                    key={attestation.uid}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm text-gray-500">
                      From:{" "}
                      <span className="font-medium text-gray-700">
                        {attestation.buyerNickname}
                      </span>
                    </p>
                    <p className="mt-1 text-gray-800">
                      {attestation.reviewText}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(attestation.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "given" && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Reviews Given</h2>
            {profileData.attestationsGiven.length === 0 ? (
              <p className="text-gray-500">No reviews given yet.</p>
            ) : (
              <ul className="space-y-4">
                {profileData.attestationsGiven.map((attestation) => (
                  <li
                    key={attestation.uid}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm text-gray-500">
                      To:{" "}
                      <span className="font-medium text-gray-700">
                        {attestation.sellerNickname}
                      </span>
                    </p>
                    <p className="mt-1 text-gray-800">
                      {attestation.reviewText}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(attestation.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
