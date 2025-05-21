import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { usePrivy, type LinkedAccountWithMetadata } from "@privy-io/react-auth";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

interface User {
  id: string;
  nickname: string;
  walletAddress: string;
}

function isWalletAccount(account: LinkedAccountWithMetadata) {
  return "address" in account;
}

export default function Index() {
  const [step, setStep] = useState(1);
  const [options, setOptions] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [customNick, setCustomNick] = useState("");

  const { authenticated, user, login, getAccessToken } = usePrivy();
  // console.log(user);

  // Step 1: search users
  useEffect(() => {
    if (step !== 1) return;
    (async () => {
      try {
        // const token = await getAccessToken();
        // const res = await fetch(`/users?q=${encodeURIComponent(query)}`, {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        const res = {
          ok: true,
          json: async () => [
            { id: "1", nickname: "Alice", walletAddress: "0xAliceWallet" },
            { id: "2", nickname: "Bob", walletAddress: "0xBobWallet" },
          ],
        };
        if (!res.ok) throw new Error();
        const data: User[] = await res.json();
        setOptions(data);
      } catch {
        setOptions([]);
      }
    })();
  }, [query, step, getAccessToken]);

  const submitAttestation = async () => {
    if (!selected || !user) return;
    const token = await getAccessToken();
    const linkedAccount = user.linkedAccounts?.[0];
    if (!isWalletAccount(linkedAccount)) return;
    const buyerAddress = linkedAccount.address;
    if (!buyerAddress) return;
    await fetch("/attestations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sellerAddress: selected.walletAddress,
        buyerAddress,
        reviewText,
      }),
    });
    // TODO: handle success / reset form
  };

  const submitNickname = async () => {
    if (!user) return;
    // const signature = await signMessage({
    //   message: `Set nickname:${customNick}`,
    // });
    // const token = await getAccessToken();
    // await fetch("/nickname", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${token}`,
    //   },
    //   body: JSON.stringify({ nickname: customNick, signature }),
    // });
    // TODO: confirm nickname set
    setStep(3);
  };

  return (
    <div className="mx-auto max-w-md p-4">
      {step >= 1 && (
        <>
          <h2 className="mb-4 text-xl font-semibold">Vouch: Who helped you?</h2>
          <Combobox
            value={selected}
            onChange={(opt: User) => {
              setSelected(opt);
              setStep(2);
            }}
          >
            <ComboboxInput
              className="w-full rounded border px-2 py-1"
              onChange={(e) => setQuery(e.target.value)}
              displayValue={(opt: User) => opt?.nickname}
              placeholder="Search by nickname..."
            />
            <ComboboxOptions className="mt-1 max-h-60 overflow-auto rounded border">
              {options.map((opt) => (
                <ComboboxOption
                  key={opt.id}
                  value={opt}
                  className="cursor-pointer px-2 py-1 hover:bg-gray-100"
                >
                  {opt.nickname}
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          </Combobox>
        </>
      )}

      {step >= 2 && (
        <>
          <h2 className="mb-4 text-xl font-semibold">
            Authenticate &amp; Choose a Nickname
          </h2>
          {authenticated && user ? (
            <p className="mb-2">
              Logged in as:{" "}
              {isWalletAccount(user.linkedAccounts?.[0])
                ? user.linkedAccounts[0].address
                : "Unknown account"}
            </p>
          ) : (
            <button onClick={login} className="btn">
              Log in to Privy
            </button>
          )}

          {authenticated && user && (
            <div className="mt-4 space-y-4">
              {/* custom nickname only */}
              <label className="flex flex-col">
                <span className="ml-2">
                  Custom nickname{" "}
                  <span className="text-sm text-gray-500">(optional)</span>
                </span>
                <input
                  type="text"
                  value={customNick}
                  onChange={(e) => setCustomNick(e.target.value)}
                  placeholder="Enter your nickname"
                  className="mt-1 w-full rounded border px-2 py-1"
                />
              </label>

              <div className="mt-4">
                <button onClick={submitNickname} className="btn-primary">
                  Continue
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="mb-4 text-xl font-semibold">Leave a Review</h2>
          <textarea
            className="w-full rounded border p-2"
            rows={4}
            maxLength={280}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did they do for you?"
          />
          <div className="mt-4 space-x-2">
            <button onClick={submitAttestation} className="btn-primary">
              Submit Vouch
            </button>
            <button onClick={() => setStep(1)} className="btn-secondary">
              Start Over
            </button>
          </div>
        </>
      )}
    </div>
  );
}
