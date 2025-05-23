import { Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Fragment, useEffect } from "react";

export interface NotificationProps {
  id: string;
  show: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "warning";
  onDismissRequest: (id: string) => void;
  autoDismiss?: number; // milliseconds
}

export function Notification({
  id,
  show,
  title,
  message,
  type,
  onDismissRequest,
  autoDismiss = 5000,
}: NotificationProps) {
  useEffect(() => {
    if (show && autoDismiss) {
      const timer = setTimeout(() => {
        onDismissRequest(id);
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [show, autoDismiss, onDismissRequest, id]);

  const Icon =
    type === "success"
      ? CheckCircleIcon
      : type === "error"
        ? XCircleIcon
        : ExclamationTriangleIcon;
  const iconColor =
    type === "success"
      ? "text-green-400"
      : type === "error"
        ? "text-red-400"
        : "text-yellow-400";

  return (
    <Transition
      show={show}
      as={Fragment}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5">
        <div className="p-4">
          <div className="flex items-start">
            <div className="shrink-0">
              <Icon aria-hidden="true" className={`size-6 ${iconColor}`} />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">{title}</p>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
            <div className="ml-4 flex shrink-0">
              <button
                type="button"
                onClick={() => onDismissRequest(id)}
                className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
}

export function NotificationContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {children}
      </div>
    </div>
  );
}
