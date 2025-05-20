import { PrivyProvider } from "@privy-io/react-auth";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { sepolia } from "viem/chains";
import "./index.css";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID}
        clientId={import.meta.env.VITE_PRIVY_CLIENT_ID}
        config={{
          // only show these login methods in the modal
          loginMethods: [
            "google",
            "discord",
            "farcaster",
            "passkey",
            "wallet", // will include embedded & external wallets
          ],
          // only allow Ethereum
          supportedChains: [sepolia],
          defaultChain: sepolia,
        }}
      >
        <RouterProvider router={router} />
      </PrivyProvider>
    </StrictMode>,
  );
}
