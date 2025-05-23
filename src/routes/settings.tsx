import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { InputField } from "../components/Input";
import { useUser } from "../hooks/useUser";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const {
    user,
    nickname,
    updateNickname,
    isUpdatingNickname,
    nicknameError,
    authenticated,
  } = useUser();
  const [currentNicknameInput, setCurrentNicknameInput] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated === false) {
      // Check explicitly for false if initial state is undefined/null
      navigate({ to: "/" });
    }
  }, [authenticated, navigate]);

  useEffect(() => {
    if (nickname) {
      setCurrentNicknameInput(nickname);
    } else {
      setCurrentNicknameInput(""); // Clear if nickname becomes null (e.g. after logout/error)
    }
  }, [nickname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setFormError(null); // Clear previous form error
    const success = await updateNickname(currentNicknameInput);
    if (success) {
      setSuccessMessage("Nickname updated successfully!");
    } else {
      // nicknameError from useUser might contain the update error
      setFormError(nicknameError?.message || "Failed to update nickname.");
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-md p-4 text-center">
        Loading user data or not logged in...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-4">
      <h2 className="mb-6 text-left text-2xl font-semibold">Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Your Nickname"
          id="nickname"
          type="text"
          value={currentNicknameInput}
          onChange={(e) => setCurrentNicknameInput(e.target.value)}
          placeholder="Enter your nickname"
          disabled={isUpdatingNickname}
          error={formError || nicknameError?.message} // Display formError first, then general error
        />
        {successMessage && (
          <p className="text-sm text-green-600">{successMessage}</p>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={
            isUpdatingNickname ||
            currentNicknameInput.trim() === (nickname || "")
          }
        >
          {isUpdatingNickname ? "Saving..." : "Save Nickname"}
        </Button>
      </form>
    </div>
  );
}
