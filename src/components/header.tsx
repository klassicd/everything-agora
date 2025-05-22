import { Dialog, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import {
  ArrowLeftEndOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
} from "@heroicons/react/24/solid";
import { usePrivy } from "@privy-io/react-auth";
import { Link, type ToPathOption } from "@tanstack/react-router";
import { useMemo, useState } from "react";

// Define a more specific type for navigation items
interface NavigationItem {
  name: string;
  to: ToPathOption; // Use a general type that Link accepts for 'to'
  params?: Record<string, string>; // Optional params
}

const baseNavigation: NavigationItem[] = [
  { name: "Vouch", to: "/" },
  { name: "Leaderboard", to: "/leaderboard" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { login, logout, authenticated, user } = usePrivy();

  const navigation = useMemo(() => {
    const navItems = [...baseNavigation];
    const currentAddress = user?.wallet?.address;
    if (authenticated && currentAddress) {
      navItems.push({
        name: "My Profile",
        to: "/profile/$address",
        params: { address: currentAddress },
      });
    }
    return navItems;
  }, [authenticated, user]);

  return (
    <header className="bg-white">
      <nav
        aria-label="Global"
        className="flex items-center justify-between p-6 md:px-8"
      >
        <div className="flex items-center md:flex-1">
          <Link to="/" className="-m-1.5 flex items-center p-1.5">
            <span className="sr-only">Everything Agora</span>
            <img
              alt=""
              src="/images/eth-glyph-colored.png"
              className="h-8 w-auto"
            />
            <span className="ml-2 hidden text-2xl font-semibold text-gray-900 lg:inline-block">
              Everything Agora
            </span>
          </Link>
        </div>
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="h-6 w-6" />
          </button>
        </div>
        <div className="hidden md:flex md:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.to}
              params={item.params}
              className="text-sm/6 font-semibold text-gray-900"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex md:flex-1 md:justify-end">
          <button
            onClick={authenticated ? logout : login}
            className="flex cursor-pointer items-center text-sm/6 font-semibold text-gray-900"
          >
            {authenticated ? (
              <ArrowLeftEndOnRectangleIcon
                className="mr-1 h-6 w-6"
                aria-hidden="true"
              />
            ) : (
              <ArrowRightEndOnRectangleIcon
                className="mr-1 h-6 w-6"
                aria-hidden="true"
              />
            )}
            {authenticated ? "Log out" : "Log in"}
          </button>
        </div>
      </nav>

      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="md:hidden"
      >
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="-m-1.5 flex items-center p-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Everything Agora</span>
              <img
                alt=""
                src="/images/eth-glyph-colored.png"
                className="h-8 w-auto"
              />
              <span className="ml-2 text-2xl font-semibold text-gray-900">
                Everything Agora
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.to}
                    params={item.params}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (authenticated) {
                      logout();
                    } else {
                      login();
                    }
                  }}
                  className="-mx-3 block flex cursor-pointer items-center rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                >
                  {authenticated ? (
                    <ArrowLeftEndOnRectangleIcon
                      className="mr-1 h-6 w-6"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRightEndOnRectangleIcon
                      className="mr-1 h-6 w-6"
                      aria-hidden="true"
                    />
                  )}
                  {authenticated ? "Log out" : "Log in"}
                </button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>
    </header>
  );
}
