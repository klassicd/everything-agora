import {
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid";

interface AlertBoxProps {
  title: string;
  messages?: string[];
  type: "error" | "warning" | "info";
  className?: string;
}

export function AlertBox({
  title,
  messages,
  type,
  className = "",
}: AlertBoxProps) {
  const Icon =
    type === "error"
      ? XCircleIcon
      : type === "warning"
        ? ExclamationTriangleIcon
        : InformationCircleIcon;
  const bgColor =
    type === "error"
      ? "bg-red-50"
      : type === "warning"
        ? "bg-yellow-50"
        : "bg-blue-50";
  const iconColor =
    type === "error"
      ? "text-red-400"
      : type === "warning"
        ? "text-yellow-400"
        : "text-blue-400";
  const titleColor =
    type === "error"
      ? "text-red-800"
      : type === "warning"
        ? "text-yellow-800"
        : "text-blue-800";
  const messageColor =
    type === "error"
      ? "text-red-700"
      : type === "warning"
        ? "text-yellow-700"
        : "text-blue-700";

  return (
    <div className={`rounded-md ${bgColor} p-4 ${className}`}>
      <div className="flex">
        <div className="shrink-0">
          <Icon aria-hidden="true" className={`size-5 ${iconColor}`} />
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${titleColor}`}>{title}</h3>
          {messages && messages.length > 0 && (
            <div className={`mt-2 text-sm ${messageColor}`}>
              <ul role="list" className="list-disc space-y-1 pl-5">
                {messages.map((msg, index) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
