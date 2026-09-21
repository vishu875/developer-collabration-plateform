import { create } from "zustand";

interface UserState {
  // The user data from our DB (not NextAuth session)
  profile: {
    id: string;
    username: string;
    email: string;
    profilePicture: string;
    bio: string;
    skills: string[];
    githubUsername?: string;
    isAdmin: boolean;
  } | null;
  setProfile: (profile: UserState["profile"]) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
}));

// -------- Notification Store --------

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnread: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
