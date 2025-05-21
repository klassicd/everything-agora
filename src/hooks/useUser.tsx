import { usePrivy } from "@privy-io/react-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const baseUrl = import.meta.env.VITE_API_URL;

// Define a query key for the user's nickname
const userNicknameQueryKey = ["userNickname"];

export function useUser() {
  const {
    authenticated,
    user,
    login,
    logout: privyLogout,
    getAccessToken,
  } = usePrivy();
  const queryClient = useQueryClient();

  // Fetch user nickname using useQuery
  const {
    data: nickname,
    isLoading: isLoadingNickname,
    error: nicknameError,
    refetch: refetchNickname,
  } = useQuery<string | null, Error>({
    queryKey: userNicknameQueryKey,
    queryFn: async () => {
      if (!authenticated || !user) {
        return null; // Or throw an error if you prefer, TanStack Query will catch it
      }
      const token = await getAccessToken();
      const res = await fetch(`${baseUrl}/users/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Failed to fetch nickname" }));
        throw new Error(
          errorData.message ||
            `Failed to fetch nickname, status: ${res.status}`,
        );
      }
      const data = await res.json();
      return data.nickname || null;
    },
    enabled: !!authenticated && !!user, // Only run query if authenticated and user object exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: true,
  });

  // Update nickname using useMutation
  const {
    mutateAsync: updateNicknameMutation,
    isPending: isUpdatingNickname,
    error: updateNicknameError,
  } = useMutation<
    { nickname: string }, // Expected success response (can be void if API doesn't return new nickname)
    Error, // Error type
    string // Type of the variable passed to mutate function (newNickname)
  >({
    mutationFn: async (newNickname: string) => {
      if (!newNickname.trim()) {
        throw new Error("Nickname cannot be empty.");
      }
      const token = await getAccessToken();
      const response = await fetch(`${baseUrl}/users/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname: newNickname.trim() }),
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to set nickname" }));
        throw new Error(
          errorData.message ||
            `Failed to set nickname, status: ${response.status}`,
        );
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch the userNickname query to get the fresh data
      //   queryClient.invalidateQueries({ queryKey: userNicknameQueryKey });
      // Or, if the mutation returns the new nickname, update the cache directly:
      queryClient.setQueryData(userNicknameQueryKey, data.nickname);
    },
    // onError can be handled by the component or globally
  });

  const updateNickname = useCallback(
    async (newNickname: string) => {
      try {
        await updateNicknameMutation(newNickname);
        return true;
      } catch (e) {
        // Error is already available via updateNicknameError from useMutation
        console.error("Update nickname failed:", e);
        return false;
      }
    },
    [updateNicknameMutation],
  );

  const logout = useCallback(async () => {
    await privyLogout();
    queryClient.setQueryData(userNicknameQueryKey, null); // Clear nickname from cache on logout
    queryClient.removeQueries({ queryKey: userNicknameQueryKey }); // Optionally remove entirely
    // Other app-specific state resets can be done in components if needed
  }, [privyLogout, queryClient]);

  return {
    authenticated,
    user,
    login,
    logout,
    nickname: nickname ?? null, // Ensure it's null if undefined
    isLoadingNickname,
    nicknameError: nicknameError || updateNicknameError, // Combine fetch and update errors if needed, or handle separately
    updateNickname,
    isUpdatingNickname,
    getAccessToken,
    refetchNickname, // Expose refetch if manual refetching is desired
  };
}
