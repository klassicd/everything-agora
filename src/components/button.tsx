import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: "bg-purple-600 text-white hover:bg-purple-500",
  secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "px-4 py-2 rounded focus:outline-none cursor-pointer focus:ring";
  return (
    <button
      className={`${base} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
