import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { usePrivy, type LinkedAccountWithMetadata } from "@privy-io/react-auth";
import { createFileRoute, Link } from "@tanstack/react-router"; // Import Link
import { useEffect, useState } from "react";
import { Button } from "../components/button";

// Helper hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export const Route = createFileRoute("/")({
  component: Index,
});

interface User {
  nickname: string;
  address: string;
}

function isWalletAccount(account: LinkedAccountWithMetadata) {
  return "address" in account;
}

export default function Index() {
  const [step, setStep] = useState(1);
  const [options, setOptions] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<User | null>(null); // Renamed from selected
  const [reviewText, setReviewText] = useState("");

  // State for nickname input and confirmed nickname
  const [currentUserNicknameInput, setCurrentUserNicknameInput] = useState(""); // For the input field
  const [confirmedUserNickname, setConfirmedUserNickname] = useState<
    string | null
  >(null); // Nickname from API

  const { authenticated, user, login, getAccessToken } = usePrivy();
  const baseUrl = import.meta.env.VITE_API_URL;

  const debouncedQuery = useDebounce(query, 300);

  // Effect to reset state on logout
  useEffect(() => {
    if (!authenticated) {
      setStep(1);
      setCurrentUserNicknameInput("");
      setConfirmedUserNickname(null);
      setSelectedSeller(null);
      setReviewText("");
      setQuery("");
      setOptions([]);
    }
  }, [authenticated]);

  // Effect to fetch user's nickname on auth change or if step is 1 (e.g. after "Start Over")
  useEffect(() => {
    const fetchUserNickname = async () => {
      if (!authenticated || !user) {
        setConfirmedUserNickname(null); // Ensure confirmed nickname is cleared if not authenticated
        setCurrentUserNicknameInput("");
        return;
      }

      try {
        const token = await getAccessToken();
        const res = await fetch(`${baseUrl}/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.nickname) {
            setConfirmedUserNickname(data.nickname);
            setCurrentUserNicknameInput(data.nickname); // Pre-fill input state as well
            // If user is on step 1 (e.g. initial load, or after "Start Over")
            // and has a nickname, automatically move to step 2.
            if (step === 1) {
              setStep(2);
            }
          } else {
            setConfirmedUserNickname(null); // No nickname found
            // If no nickname, and user is on step 1, they should stay to set it.
          }
        } else {
          console.error("Failed to fetch nickname, status:", res.status);
          setConfirmedUserNickname(null);
        }
      } catch (error) {
        console.error("Failed to fetch nickname:", error);
        setConfirmedUserNickname(null);
      }
    };

    fetchUserNickname();
  }, [authenticated, user, getAccessToken, baseUrl, step, setStep]); // step & setStep are dependencies for the conditional step change

  // Step 2: Search sellers (uses debouncedQuery)
  useEffect(() => {
    if (step !== 2 || !debouncedQuery.trim() || !authenticated) {
      setOptions([]);
      return;
    }
    (async () => {
      try {
        const token = await getAccessToken();
        const res = await fetch(
          `${baseUrl}/users?search=${encodeURIComponent(debouncedQuery)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
        const data: User[] = await res.json();
        setOptions(data);
      } catch (error) {
        console.error(error);
        setOptions([]);
      }
    })();
  }, [debouncedQuery, step, getAccessToken, baseUrl, authenticated]);

  const submitAttestation = async () => {
    if (
      !selectedSeller ||
      !user ||
      !reviewText.trim() ||
      !confirmedUserNickname
    )
      return; // Guard clause
    const token = await getAccessToken();
    const linkedAccount = user.linkedAccounts?.find(isWalletAccount); // Ensure it's a wallet
    if (!linkedAccount || !isWalletAccount(linkedAccount)) return; // Check if it's a wallet account
    const buyerAddress = linkedAccount.address;
    if (!buyerAddress) return;

    await fetch(`${baseUrl}/attestations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sellerAddress: selectedSeller.address,
        buyerAddress,
        reviewText,
      }),
    });
    // TODO: handle success / reset form
    alert("Vouch submitted!"); // Placeholder for success
    setReviewText("");
    setSelectedSeller(null);
    setQuery("");
    setStep(1); // Or 2, depending on desired flow after submission
  };

  const submitNickname = async () => {
    if (!currentUserNicknameInput.trim()) return;
    const token = await getAccessToken();
    try {
      const response = await fetch(`${baseUrl}/users/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: currentUserNicknameInput.trim() }),
      });
      if (response.ok) {
        setConfirmedUserNickname(currentUserNicknameInput.trim());
        setStep(2); // Move to seller selection step
      } else {
        // TODO: Handle nickname submission error
        alert("Failed to set nickname.");
      }
    } catch (error) {
      console.error("Error submitting nickname:", error);
      alert("Error submitting nickname.");
    }
  };

  const canSubmitVouch =
    !!selectedSeller && !!reviewText.trim() && !!confirmedUserNickname;

  return (
    <div className="mx-auto max-w-md p-4">
      {/* This section is always evaluated first */}
      <div className="pt-4">
        <h2 className="mb-4 text-xl font-semibold">Vouch For Your Community</h2>

        {authenticated && user ? (
          <>
            <p className="mb-2">
              Logged in as:{" "}
              {user.linkedAccounts.find(isWalletAccount)?.address ??
                "Unknown account"}
            </p>
            <p className="mb-4 text-gray-700">
              Optionally pick a nickname to help recognize those who give their
              time, and be recognized yourself. A nickname is required to vouch.
            </p>
            {/* Nickname Display or Input Section */}
            <div className="mt-4 space-y-4">
              {confirmedUserNickname ? (
                <div>
                  <p className="mb-1">
                    Your Nickname:{" "}
                    <span className="font-semibold">
                      {confirmedUserNickname}
                    </span>
                    &nbsp; (
                    <Link
                      to="/profile"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    )
                  </p>
                </div>
              ) : (
                <>
                  <label className="flex flex-col">
                    <span className="ml-2">
                      Set Your Nickname{" "}
                      <span className="text-sm text-gray-500">
                        (required to vouch)
                      </span>
                    </span>
                    <input
                      type="text"
                      value={currentUserNicknameInput}
                      onChange={(e) =>
                        setCurrentUserNicknameInput(e.target.value)
                      }
                      placeholder="Enter your nickname"
                      className="mt-1 w-full rounded border px-2 py-1"
                    />
                  </label>
                  {currentUserNicknameInput.trim() && (
                    <div className="mt-2">
                      <Button
                        onClick={submitNickname}
                        variant="primary"
                        disabled={!currentUserNicknameInput.trim()}
                      >
                        Set Nickname & Continue
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <Button onClick={login} variant="primary">
            Join with Privy
          </Button>
        )}
      </div>

      {/* Step-dependent content, only shown if authenticated and nickname is set (or being set) */}
      {authenticated && user && (
        <>
          {/* Step 2: Vouch - Who helped you? (Requires confirmed nickname) */}
          {step === 2 && confirmedUserNickname && (
            <div className="pt-4">
              {" "}
              {/* Added pt-4 for spacing */}
              <h2 className="mb-4 text-xl font-semibold">
                Vouch: Who helped you?
              </h2>
              <Combobox
                value={selectedSeller}
                onChange={(opt: User | null) => {
                  // Allow null for clearing
                  setSelectedSeller(opt);
                  if (opt) {
                    setStep(3); // Move to review step only if a seller is selected
                  }
                }}
              >
                <ComboboxInput
                  className="w-full rounded border px-2 py-1"
                  onChange={(e) => setQuery(e.target.value)}
                  displayValue={(opt: User) => opt?.nickname || ""}
                  placeholder="Search by nickname..."
                />
                <ComboboxOptions className="mt-1 max-h-60 overflow-auto rounded border">
                  {options.length > 0
                    ? options.map((opt) => (
                        <ComboboxOption
                          key={opt.address}
                          value={opt}
                          className="cursor-pointer px-2 py-1 hover:bg-gray-100"
                        >
                          {opt.nickname} ({opt.address.substring(0, 6)}...)
                        </ComboboxOption>
                      ))
                    : debouncedQuery.trim() && (
                        <div className="px-2 py-1 text-gray-500">
                          No results found
                        </div>
                      )}
                </ComboboxOptions>
              </Combobox>
            </div>
          )}

          {/* Step 3: Leave a Review (Requires confirmed nickname and selected seller) */}
          {step === 3 && selectedSeller && confirmedUserNickname && (
            <div className="pt-4">
              <h2 className="mb-4 text-xl font-semibold">
                Leave a Review for {selectedSeller.nickname}
              </h2>
              <textarea
                className="w-full rounded border p-2"
                rows={4}
                maxLength={280}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did they do for you?"
              />
              <div className="mt-4 space-x-2">
                <Button
                  onClick={submitAttestation}
                  variant="primary"
                  disabled={!canSubmitVouch}
                >
                  Submit Vouch
                </Button>
                <Button
                  onClick={() => {
                    setStep(1); // This will trigger the useEffect to check nickname and potentially go to step 2
                    setSelectedSeller(null); // Clear selected seller
                    setReviewText(""); // Clear review text
                    setQuery(""); // Clear search query
                  }}
                  variant="secondary"
                >
                  Start Over
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
