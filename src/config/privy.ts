import type { PrivyClientConfig } from "@privy-io/react-auth";
import { sepolia } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  // Create embeddedd wallet for users without one
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  // only show these login methods in the modal
  loginMethods: [
    "google",
    "discord",
    "farcaster",
    "passkey",
    "wallet", // will include embedded & external wallets
  ],
  // only allow Sepolia
  supportedChains: [sepolia],
  defaultChain: sepolia,
};
