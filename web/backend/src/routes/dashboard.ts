import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, and, or } from 'drizzle-orm';
import { calculateLevel } from '../lib/xp';

const dashboard = new Hono();

const BADGE_DEFS = [
    { id: 'b1', name: '7-Day Warrior', description: 'Complete a 7-day streak', tier: 'bronze', requiredStreak: 7 },
    { id: 'b2', name: '14-Day Fighter', description: 'Complete a 14-day streak', tier: 'silver', requiredStreak: 14 },
    { id: 'b3', name: '30-Day Legend', description: 'Complete a 30-day streak', tier: 'gold', requiredStreak: 30 },
    { id: 'b4', name: '60-Day Master', description: 'Complete a 60-day streak', tier: 'gold', requiredStreak: 60 },
    { id: 'b5', name: '100-Day Champion', description: 'Complete a 100-day streak', tier: 'diamond', requiredStreak: 100 },
    { id: 'b6', name: '365-Day Immortal', description: 'Complete a 365-day streak', tier: 'diamond', requiredStreak: 365 },
];

function getWeekDates(): string[] {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toISOString().split('T')[0];
    });
}

function getPast7Dates(): string[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });
}

// GET /api/dashboard
dashboard.get('/', async (c) => {
    try {
        const userId = c.get('userId' as never) as string;

        const habits = await db.select().from(schema.habits).where(eq(schema.habits.userId, userId));
        const totalHabits = habits.length || 1; // avoid div-by-zero

        // ─── Real weekly streak from habit_entries ───────────────
        const weekDates = getWeekDates();
        const today = new Date().toISOString().split('T')[0];
        const allEntries = await db.select().from(schema.habitEntries);

        const weeklyStreak = weekDates.map(date => {
            if (date > today) return 'pending';
            const dayEntries = allEntries.filter(e => e.date === date);
            const completed = dayEntries.filter(e => e.status === 'completed').length;
            if (completed >= totalHabits) return 'completed';
            if (completed > 0) return 'completed'; // partial counts as done
            if (dayEntries.length > 0) return 'missed';
            return date === today ? 'pending' : 'missed';
        });

        // ─── Real chart data: completions per day for past 7 days ─
        const past7 = getPast7Dates();
        const chartData = past7.map(date => {
            const dayEntries = allEntries.filter(e => e.date === date);
            const completed = dayEntries.filter(e => e.status === 'completed').length;
            return Math.round((completed / totalHabits) * 100);
        });

        // ─── Real completion stats ──────────────────────────────
        const todayEntries = allEntries.filter(e => e.date === today);
        const todayCompleted = todayEntries.filter(e => e.status === 'completed').length;
        const completionPercent = todayCompleted / totalHabits;

        // Weekly stats
        const weekEntries = allEntries.filter(e => weekDates.includes(e.date));
        const totalWins = weekEntries.filter(e => e.status === 'completed').length;
        const totalTarget = totalHabits * 7;

        // Momentum = weighted score from streak + completion
        const totalStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);
        const avgStreak = totalStreak / totalHabits;
        const momentumScore = Math.min(100, Math.round(
            (completionPercent * 40) + (Math.min(avgStreak, 30) / 30 * 40) + (totalWins / Math.max(totalTarget, 1) * 20)
        ));

        // ─── Badges ─────────────────────────────────────────────
        const earnedBadges = await db.select().from(schema.userBadges).where(eq(schema.userBadges.userId, userId));
        const earnedNames = new Set(earnedBadges.map(b => b.badgeName));

        const badges = BADGE_DEFS.map(b => ({
            ...b,
            isEarned: earnedNames.has(b.name),
            earnedAt: earnedBadges.find(eb => eb.badgeName === b.name)?.earnedAt,
        }));

        // ─── User XP & Level ────────────────────────────────────
        const userList = await db.select().from(schema.users).where(eq(schema.users.id, userId));
        const user = userList[0];
        const userXp = user?.xp || 0;
        const { level, xpInLevel, xpToNext } = calculateLevel(userXp);

        // ─── Extended Data: Challenges ──────────────────────────
        const now = new Date();
        const allChallenges = await db.select().from(schema.challenges);
        const activeChallenges = await Promise.all(allChallenges
            .filter(ch => {
                const start = new Date(ch.startDate);
                const end = new Date(ch.endDate);
                return now >= start && now <= end;
            })
            .map(async (ch) => {
                const parts = await db.select().from(schema.challengeParticipants)
                    .where(eq(schema.challengeParticipants.challengeId, ch.id));
                const end = new Date(ch.endDate);
                return {
                    ...ch,
                    participantCount: parts.length,
                    isActive: true,
                    daysRemaining: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)),
                };
            }));

        // ─── Extended Data: Communities ─────────────────────────
        const memberships = await db.select().from(schema.communityMembers)
            .where(eq(schema.communityMembers.userId, userId));
        const communities = await Promise.all(memberships.map(async (m) => {
            const cms = await db.select().from(schema.communities)
                .where(eq(schema.communities.id, m.communityId));
            const cm = cms[0];
            return cm ? { ...cm, myRole: m.role } : null;
        }));
        const finalCommunities = communities.filter(Boolean);

        // ─── Extended Data: Friends ─────────────────────────────
        const friendshipsList = await db.select().from(schema.friendships)
            .where(and(
                or(eq(schema.friendships.requesterId, userId), eq(schema.friendships.addresseeId, userId)),
                eq(schema.friendships.status, 'accepted'),
            ));
        const friendships = friendshipsList; // rename to match previous usage
        const friendIds = friendships.map(f => f.requesterId === userId ? f.addresseeId : f.requesterId);
        const friendsList = await Promise.all(friendIds.map(async (fid) => {
            const usersFound = await db.select({
                id: schema.users.id, name: schema.users.name,
                level: schema.users.level, loginStreak: schema.users.loginStreak
            }).from(schema.users).where(eq(schema.users.id, fid));
            return usersFound[0];
        }));
        const friends = friendsList.filter(Boolean);

        // ─── Server-Side Quote ──────────────────────────────────
        const QUOTES = [
            "Small daily improvements lead to staggering results.",
            "Success is the sum of small efforts, repeated.",
            "You don't have to be extreme, just consistent.",
            "The secret of getting ahead is getting started.",
            "Discipline is choosing between what you want now and what you want most.",
            "Every day is a fresh start.",
            "Build habits that build you.",
            "Progress, not perfection.",
            "One habit at a time changes everything.",
            "Your future self will thank you.",
        ];
        const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
        const quote = QUOTES[dayOfYear % QUOTES.length];

        return c.json({
            quote,
            momentumScore,
            completionPercent: Math.round(completionPercent * 100) / 100,
            totalWins,
            totalTarget,
            currentStreak: totalStreak,
            weeklyStreak,
            chartData,
            badges,
            xp: userXp,
            level,
            xpInLevel,
            xpToNext,
            loginStreak: user?.loginStreak || 0,
            habits: habits.map(h => ({
                ...h,
                daysOfWeek: h.daysOfWeek.split(',').map(Number),
                reminderEnabled: Boolean(h.reminderEnabled),
                status: todayEntries.find(e => e.habitId === h.id)?.status || 'pending',
            })),
            challenges: activeChallenges,
            communities: finalCommunities,
            friends,
        });
    } catch (e: any) {
        console.error('Dashboard Error:', e);
        return c.json({ error: e.message || 'Internal Server Error' }, 500);
    }
});

// GET /api/dashboard/stats
dashboard.get('/stats', async (c) => {
    try {
        const userId = c.get('userId' as never) as string;

        // 1. Habits by category
        const habits = await db.select().from(schema.habits).where(eq(schema.habits.userId, userId));
        const categories: Record<string, number> = {};
        for (const h of habits) {
            categories[h.category] = (categories[h.category] || 0) + 1;
        }

        // 2. All completed entries to calculate stats
        const habitIds = habits.map(h => h.id);
        let entries: any[] = [];
        if (habitIds.length > 0) {
            const { inArray } = await import('drizzle-orm');
            entries = await db.select().from(schema.habitEntries)
                .where(and(
                    inArray(schema.habitEntries.habitId, habitIds),
                    eq(schema.habitEntries.status, 'completed')
                ));
        }

        // Total Lifetime Completions
        const totalCompletions = entries.length;

        // Perfect Days (days where completed count >= total habits)
        const entriesByDate: Record<string, number> = {};
        for (const e of entries) {
            entriesByDate[e.date] = (entriesByDate[e.date] || 0) + 1;
        }
        let perfectDays = 0;
        const totalHabits = habits.length || 1;
        for (const date in entriesByDate) {
            if (entriesByDate[date] >= totalHabits) {
                perfectDays++;
            }
        }

        // Most active day of week (0-6, where 0 is Sunday)
        const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
        for (const e of entries) {
            const d = new Date(e.date);
            dayOfWeekCounts[d.getDay()]++;
        }

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let mostActiveDay = 'None';
        let maxCount = 0;
        dayOfWeekCounts.forEach((count, i) => {
            if (count > maxCount) {
                maxCount = count;
                mostActiveDay = days[i];
            }
        });

        return c.json({
            categories,
            totalCompletions,
            perfectDays,
            mostActiveDay,
            dayOfWeekDistribution: dayOfWeekCounts
        });

    } catch (e: any) {
        console.error('Stats Error:', e);
        return c.json({ error: e.message || 'Internal Server Error' }, 500);
    }
});

export default dashboard;
