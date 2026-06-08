// ═══════════════════════════════════════════════════════════════
//  Rithmic — API Service Layer (React Native)
//  Ported from web/frontend/lib/api.ts
// ═══════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    User, Habit, HabitEntry, Post, PostComment, Challenge,
    ChatMessage, Notification as AppNotification, DashboardData, LeaderboardResponse, AuthResponse,
    Community, UserProfile, DirectMessage, Conversation, DMHistory, FriendUser, FriendRequest,
    HabitCompleteResponse
} from './types';

// TODO: Change this to your deployed API URL
const API_BASE = 'https://rithmic.vercel.app';

async function getToken(): Promise<string | null> {
    return AsyncStorage.getItem('hc_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

export const api = {
    // Auth
    login: (email: string, password: string) =>
        request<AuthResponse>('/api/auth/login', {
            method: 'POST', body: JSON.stringify({ email, password }),
        }),

    // Habits
    getHabits: () => request<Habit[]>('/api/habits'),
    createHabit: (data: Partial<Habit>) => request<Habit>('/api/habits', { method: 'POST', body: JSON.stringify(data) }),
    deleteHabit: (id: string) => request<{ success: boolean }>(`/api/habits/${id}`, { method: 'DELETE' }),
    startHabit: (id: string) => request<HabitEntry>(`/api/habits/${id}/start`, { method: 'POST' }),
    completeHabit: (id: string) => request<HabitCompleteResponse>(`/api/habits/${id}/complete`, { method: 'POST' }),
    getEntries: (date: string) => request<HabitEntry[]>(`/api/habits/entries?date=${date}`),

    // Posts
    getPosts: (sort?: string) => request<Post[]>(`/api/posts?sort=${sort || 'hot'}`),
    getPost: (id: string) => request<Post>(`/api/posts/${id}`),
    createPost: (data: Partial<Post>) => request<Post>('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
    votePost: (id: string, direction: number) =>
        request<{ upvotes: number; downvotes: number; userVote: number }>(`/api/posts/${id}/vote`, { method: 'POST', body: JSON.stringify({ direction }) }),
    getComments: (postId: string) => request<PostComment[]>(`/api/posts/${postId}/comments`),
    addComment: (postId: string, body: string) =>
        request<PostComment>(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),

    // Challenges
    getChallenges: () => request<Challenge[]>('/api/challenges'),
    getChallenge: (id: string) => request<Challenge>(`/api/challenges/${id}`),
    joinChallenge: (id: string) => request<{ success: boolean }>(`/api/challenges/${id}/join`, { method: 'POST' }),
    getChatMessages: (id: string) => request<ChatMessage[]>(`/api/challenges/${id}/chat`),
    sendChatMessage: (id: string, message: string) =>
        request<ChatMessage>(`/api/challenges/${id}/chat`, { method: 'POST', body: JSON.stringify({ message }) }),

    // Notifications
    getNotifications: () => request<AppNotification[]>('/api/notifications'),
    getUnreadCount: () => request<{ count: number }>('/api/notifications/unread-count'),
    markRead: (id: string) => request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' }),

    // Dashboard
    getDashboard: () => request<DashboardData>('/api/dashboard'),

    // User Profiles
    getUserProfile: (id: string) => request<UserProfile>(`/api/users/${id}`),

    // Direct Messages
    getConversations: () => request<Conversation[]>('/api/messages'),
    getDMHistory: (userId: string) => request<DMHistory>(`/api/messages/${userId}`),
    sendDM: (userId: string, message: string) =>
        request<DirectMessage>(`/api/messages/${userId}`, { method: 'POST', body: JSON.stringify({ message }) }),

    // Leaderboard
    getLeaderboard: () => request<LeaderboardResponse>('/api/leaderboard'),

    // Friends
    searchUsers: (q: string) => request<FriendUser[]>(`/api/friends/search?q=${encodeURIComponent(q)}`),
    getSuggestions: () => request<FriendUser[]>('/api/friends/suggestions'),
    getFriends: () => request<User[]>('/api/friends'),
    getFriendRequests: () => request<FriendRequest[]>('/api/friends/requests'),
    getSentRequests: () => request<FriendRequest[]>('/api/friends/sent'),
    getFriendStatus: (userId: string) => request<{ status: string; friendshipId?: string }>(`/api/friends/status/${userId}`),
    sendFriendRequest: (userId: string) => request<{ success: boolean; friendshipId?: string }>('/api/friends/request/' + userId, { method: 'POST' }),
    acceptFriendRequest: (requestId: string) => request<{ success: boolean }>('/api/friends/accept/' + requestId, { method: 'POST' }),
    rejectFriendRequest: (requestId: string) => request<{ success: boolean }>('/api/friends/reject/' + requestId, { method: 'POST' }),
    removeFriend: (friendId: string) => request<{ success: boolean }>('/api/friends/remove/' + friendId, { method: 'DELETE' }),

    // Communities
    getCommunities: (q?: string) => request<Community[]>(`/api/communities${q ? '?q=' + encodeURIComponent(q) : ''}`),
    getMyCommunities: () => request<Community[]>('/api/communities/my'),
    getCommunity: (id: string) => request<Community>(`/api/communities/${id}`),
    createCommunity: (data: Partial<Community>) => request<{ id: string; inviteCode: string; message: string }>('/api/communities', { method: 'POST', body: JSON.stringify(data) }),
    joinCommunity: (id: string) => request<{ success: boolean }>(`/api/communities/${id}/join`, { method: 'POST' }),
    leaveCommunity: (id: string) => request<{ success: boolean }>(`/api/communities/${id}/leave`, { method: 'POST' }),
    postInCommunity: (id: string, data: Partial<Post>) => request<Post>(`/api/communities/${id}/post`, { method: 'POST', body: JSON.stringify(data) }),
    getByInviteCode: (code: string) => request<Community>(`/api/communities/invite/${code}`),
    joinByInviteCode: (code: string) => request<{ message?: string; id?: string; error?: string }>(`/api/communities/invite/${code}/join`, { method: 'POST' }),
};
