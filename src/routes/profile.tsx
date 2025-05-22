import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "../components/button"; // Adjust path as needed
import { InputField } from "../components/input"; // Adjust path as needed
import { useUser } from "../hooks/useUser"; // Adjust path as needed

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const {
    user,
    nickname,
    updateNickname,
    // isLoadingNickname, // This is for fetching
    isUpdatingNickname, // Use this for the mutation status
    nicknameError, // This could be fetch error or update error depending on your hook logic
    // updateNicknameError, // Or use this specifically for form submission error
    authenticated,
  } = useUser();
  const [currentNicknameInput, setCurrentNicknameInput] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null); // Specific for form submission
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
      // Or if you exposed updateNicknameError separately:
      // setFormError(updateNicknameError?.message || "Failed to update nickname.");
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
          disabled={isUpdatingNickname} // Use isUpdatingNickname
          error={formError || nicknameError?.message} // Display formError first, then general error
        />
        {successMessage && (
          <p className="text-sm text-green-600">{successMessage}</p>
        )}
        {/* Display general nicknameError if not specific to form and not already shown by InputField */}
        {/* {!formError && nicknameError && !InputField shows it && (
          <p className="mt-1 text-sm text-red-600">{nicknameError.message}</p>
        )} */}
        <Button
          type="submit"
          variant="primary"
          disabled={
            isUpdatingNickname || // Use isUpdatingNickname
            currentNicknameInput.trim() === (nickname || "")
          }
        >
          {isUpdatingNickname ? "Saving..." : "Save Nickname"}
        </Button>
      </form>
    </div>
  );
}
