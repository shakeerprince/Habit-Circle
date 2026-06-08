// ─── Shared Types ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  xp: number;
  level: number;
  loginStreak: number;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  daysOfWeek: number[];
  frequency: string;
  reminderEnabled: boolean;
  createdAt: string;
  colorValue: number;
  userId: string;
  status?: 'pending' | 'in_progress' | 'completed';
  currentStreak: number;
  longestStreak: number;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  habitName?: string;
  imageUrl?: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  userVote?: number; // -1, 0, 1
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  body: string;
  parentCommentId?: string;
  upvotes: number;
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  startDate: string;
  endDate: string;
  participantIds: string[];
  habitCategory: string;
  maxParticipants: number;
  isActive: boolean;
  daysRemaining: number;
  participantCount: number;
  leaderboard: { userId: string; name: string; score: number }[];
}

export interface ChatMessage {
  id: string;
  challengeId: string;
  senderId: string;
  senderName: string;
  message: string;
  sentAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'upvote' | 'post_reply' | 'challenge_invite' | 'streak_milestone' | 'chat_message' | 'reminder';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  requiredStreak: number;
  isEarned: boolean;
  earnedAt?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  icon?: string;
  bannerColor?: string;
  bannerImage?: string;
  category: string;
  creatorId: string;
  memberCount: number;
  inviteCode: string;
  createdAt: string;
  isJoined?: boolean;
  myRole?: 'admin' | 'member' | null;
  creatorName?: string;
}

export interface DashboardStats {
  momentumScore: number;
  completionPercent: number;
  totalWins: number;
  totalTarget: number;
  currentStreak: number;
  weeklyStreak: string[];
  chartData: number[];
}

export interface DashboardData extends DashboardStats {
  quote: string;
  loginStreak: number;
  level: number;
  xp: number;
  xpInLevel: number;
  xpToNext: number;
  habits: Habit[];
  challenges: Challenge[];
  communities: Community[];
  friends: User[];
  badges: Badge[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  xp: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface UserProfile extends User {
  stats: {
    totalHabits: number;
    totalStreak: number;
    longestStreak: number;
    totalPosts: number;
    totalBadges: number;
    challengesJoined: number;
  };
  badges: { name: string; earnedAt: string }[];
  habits: Partial<Habit>[];
  posts: Post[];
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  myRank: number;
  myXp: number;
}

export interface HabitCompleteResponse {
  message: string;
  xpEarned: number;
  newStreak: number;
  xp?: number;
  level?: number;
  xpInLevel?: number;
  xpToNext?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  loginReward: number;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  sentAt: string;
  isRead: boolean;
}

export interface Conversation {
  userId: string;
  name: string;
  bio: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface DMHistory {
  otherUser: {
    id: string;
    name: string;
    bio?: string;
  };
  messages: DirectMessage[];
}

export interface FriendUser extends User {
  friendStatus: 'none' | 'pending' | 'accepted' | 'rejected';
  friendshipId?: string | null;
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  requester: User;
}

export interface AdvancedStats {
  categories: Record<string, number>;
  totalCompletions: number;
  perfectDays: number;
  mostActiveDay: string;
  dayOfWeekDistribution: number[];
}
