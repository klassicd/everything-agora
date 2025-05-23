import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import {
  usePrivy,
  useWallets,
  type LinkedAccountWithMetadata,
} from "@privy-io/react-auth";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { AlertBox } from "../components/AlertBox";
import { Button } from "../components/Button";
import { LandingContent } from "../components/LandingContent";
import {
  Notification,
  NotificationContainer,
} from "../components/Notification";

const easContractAddress = import.meta.env.VITE_EAS_CONTRACT_ADDRESS;
const schemaUID = import.meta.env.VITE_REVIEW_SCHEMA_UID;

const eas = new EAS(easContractAddress);

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

interface AppNotificationStateItem {
  id: string;
  show: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "warning";
  autoDismiss?: number;
}

function isWalletAccount(account: LinkedAccountWithMetadata) {
  return "address" in account;
}

export default function Index() {
  const [step, setStep] = useState(1);
  const [options, setOptions] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<User | null>(null);
  const [reviewText, setReviewText] = useState("");

  // State for nickname input and confirmed nickname
  const [currentUserNicknameInput, setCurrentUserNicknameInput] = useState(""); // For the input field
  const [confirmedUserNickname, setConfirmedUserNickname] = useState<
    string | null
  >(null); // Nickname from API
  const [nicknameError, setNicknameError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<
    AppNotificationStateItem[]
  >([]);
  const navigate = useNavigate();

  const { authenticated, user, login, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const baseUrl = import.meta.env.VITE_API_URL;

  const debouncedQuery = useDebounce(query, 300);

  const addNotification = (
    details: Omit<AppNotificationStateItem, "id" | "show">,
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setNotifications((prev) => [...prev, { ...details, id, show: true }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, show: false } : n)),
    );
  };

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    notifications.forEach((n) => {
      if (!n.show) {
        const timer = setTimeout(() => {
          setNotifications((prev) => prev.filter((notif) => notif.id !== n.id));
        }, 500); // Cleanup after animation (Notification leave is 100ms)
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [notifications]);

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
      setNicknameError(null);
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
            setNicknameError(null); // Clear any previous nickname errors
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
          // Optionally, show a notification for fetch failure if it's critical
          // addNotification({ title: "Error", message: "Could not fetch your nickname.", type: 'error' });
        }
      } catch (error) {
        console.error("Failed to fetch nickname:", error);
        setConfirmedUserNickname(null);
        // addNotification({ title: "Error", message: "An error occurred while fetching your nickname.", type: 'error' });
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

  // Mutation function for submitting attestation
  const attestMutationFn = async (data: {
    attestationPayload: {
      signer: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sig: any;
    };
    reviewText: string;
    token: string | null;
  }) => {
    const response = await fetch(`${baseUrl}/attestations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.token}`,
      },
      body: JSON.stringify({
        attestation: data.attestationPayload,
        reviewText: data.reviewText,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Failed to submit attestation via API." }));
      const error = new Error(
        errorData.error || "Failed to submit attestation via API.",
      );
      console.error("Attestation submission failed:", error);
      throw error;
    }
    return response.json();
  };

  const attestationMutation = useMutation({
    mutationFn: attestMutationFn,
    onSuccess: () => {
      addNotification({
        title: "Vouch Submitted!",
        message: "Your vouch has been successfully submitted.",
        type: "success",
        autoDismiss: 5000,
      });
      setReviewText("");
      setSelectedSeller(null);
      setQuery("");
      setStep(1); // Reset step for current page
      // Redirect to profile page - replace '/profile' with your actual profile route
      navigate({
        to: "/profile/$address",
        params: { address: selectedSeller ? selectedSeller.address : "" },
      });
    },
    onError: (error: Error) => {
      // Error is handled by the inline AlertBox below the textarea
      console.error("Attestation submission failed:", error);
    },
  });

  const submitAttestation = async () => {
    if (
      !selectedSeller ||
      !user ||
      !reviewText.trim() ||
      !confirmedUserNickname
    ) {
      return;
    }
    // attestationMutation.reset(); // Optional: Clears previous error/data state from mutation

    if (!user.wallet) {
      console.error("User wallet not connected or available.");
      addNotification({
        title: "Wallet Error",
        message: "Wallet not connected. Please ensure your wallet is active.",
        type: "error",
      });
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      console.error("Failed to get access token for attestation.");
      addNotification({
        title: "Authentication Error",
        message: "Could not retrieve token. Please try again.",
        type: "error",
      });
      return;
    }

    const linkedAccount = user.linkedAccounts?.find(isWalletAccount);
    if (!linkedAccount) {
      console.error("No linked wallet account found.");
      addNotification({
        title: "Wallet Setup Error",
        message:
          "No linked wallet account found. Please check your Privy setup.",
        type: "error",
      });
      return;
    }

    try {
      // Get the EIP-1193 provider from Privy's user.wallet
      const wallet = wallets[0]; // Assuming the first wallet is the one to use
      if (!wallet) {
        console.error("No wallet found in Privy wallets array.");
        addNotification({
          title: "Wallet Not Found",
          message:
            "Wallet not found. Please ensure your wallet is properly connected.",
          type: "error",
        });
        return;
      }
      const eip1193Provider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(eip1193Provider);
      const signer = await ethersProvider.getSigner();
      await eas.connect(signer);

      const schemaEncoder = new SchemaEncoder("string reviewText");
      const encodedData = schemaEncoder.encodeData([
        { name: "reviewText", value: reviewText.trim(), type: "string" },
      ]);

      const offchain = await eas.getOffchain();
      const offchainAttestation = await offchain.signOffchainAttestation(
        {
          recipient: selectedSeller.address,
          expirationTime: 0n,
          time: BigInt(Math.floor(Date.now() / 1000)),
          revocable: false,
          schema: schemaUID,
          refUID:
            "0x0000000000000000000000000000000000000000000000000000000000000000",
          data: encodedData,
        },
        signer,
      );

      const serializableAttestation = {
        ...offchainAttestation,
        message: {
          ...offchainAttestation.message,
          time: Number(offchainAttestation.message.time),
          expirationTime: Number(offchainAttestation.message.expirationTime),
        },
        domain: {
          ...offchainAttestation.domain,
          chainId: Number(offchainAttestation.domain.chainId),
        },
      };

      attestationMutation.mutate({
        attestationPayload: {
          signer: signer.address,
          sig: serializableAttestation,
        },
        reviewText: reviewText.trim(),
        token: token,
      });
    } catch (error) {
      console.error("Error preparing attestation data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      // This error is for issues before calling the mutation (e.g., EAS SDK errors)
      // TanStack Query's error state won't be set for these.
      // You might want to display this differently or use a local state.
      addNotification({
        title: "Attestation Preparation Error",
        message: `Error: ${errorMessage}. See console for details.`,
        type: "error",
      });
    }
  };

  const submitNickname = async () => {
    if (!currentUserNicknameInput.trim()) return;
    setNicknameError(null); // Clear previous errors
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
        addNotification({
          title: "Nickname Set!",
          message: "Your nickname has been updated.",
          type: "success",
        });
        setStep(2); // Move to seller selection step
      } else {
        // TODO: Handle nickname submission error
        const errorData = await response.json().catch(() => ({})); // Ensure errorData is an object
        const message =
          errorData.message || "Failed to set nickname. Please try again.";
        setNicknameError(message);
        console.error("Failed to set nickname:", message, errorData);
      }
    } catch (error) {
      console.error("Error submitting nickname:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      setNicknameError(`Error submitting nickname: ${message}`);
    }
  };

  const canSubmitVouch =
    !!selectedSeller && !!reviewText.trim() && !!confirmedUserNickname;

  return (
    <>
      <NotificationContainer>
        {notifications.map((n) => (
          <Notification
            key={n.id}
            id={n.id}
            show={n.show}
            title={n.title}
            message={n.message}
            type={n.type}
            onDismissRequest={dismissNotification}
            autoDismiss={n.autoDismiss}
          />
        ))}
      </NotificationContainer>
      <div className="mx-auto max-w-md p-4">
        {/* This section is always evaluated first */}
        <div>
          <h2 className="mb-6 text-left text-2xl font-semibold">
            Vouch For Your Community
          </h2>

          {authenticated && user ? (
            <>
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
                        to="/settings"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      )
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-4 text-gray-700">
                      Pick a nickname to help recognize those who give their
                      time, and be recognized yourself. A nickname is required
                      to vouch.
                    </p>
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
                    {nicknameError && (
                      <AlertBox
                        type="error"
                        title="Nickname Error"
                        messages={[nicknameError]}
                        className="mt-2"
                      />
                    )}
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

              {/* Step 2: Vouch - Who helped you? (Requires confirmed nickname) */}
              {step === 2 && confirmedUserNickname && (
                <div className="pt-4">
                  {" "}
                  {/* Added pt-4 for spacing */}
                  <h2 className="mb-4 text-left text-xl font-semibold">
                    Who helped you?
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
                  <h2 className="mb-4 text-left text-xl font-semibold">
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
                  <p className="mt-2 text-sm text-gray-500">
                    This creates a cryptographically signed attestation.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Your reviews help participants build a verifiable history of
                    mutual aid and collaboration.
                  </p>
                  {attestationMutation.isError && (
                    <AlertBox
                      type="error"
                      title="Submission Error"
                      messages={[
                        (attestationMutation.error as Error)?.message ||
                          "An error occurred.",
                      ]}
                      className="mt-2"
                    />
                  )}
                  <div className="mt-4 space-x-2">
                    <Button
                      onClick={submitAttestation}
                      variant="primary"
                      disabled={
                        !canSubmitVouch || attestationMutation.isPending
                      }
                    >
                      {attestationMutation.isPending
                        ? "Submitting..."
                        : "Submit Vouch"}
                    </Button>
                    <Button
                      onClick={() => {
                        setStep(1);
                        setSelectedSeller(null);
                        setReviewText("");
                        setQuery("");
                        attestationMutation.reset(); // Reset mutation state if starting over
                      }}
                      variant="secondary"
                    >
                      Start Over
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <LandingContent onLogin={login} />
          )}
        </div>
      </div>
    </>
  );
}
