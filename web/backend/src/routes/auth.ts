import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { generateToken } from '../middleware/auth';
import { awardXP, XP_REWARDS, calculateLevel } from '../lib/xp';

const auth = new Hono();

// POST /api/auth/register
auth.post('/register', async (c) => {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
    }

    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, email));
    if (existingUser.length > 0) {
        return c.json({ error: 'Email already registered' }, 400);
    }

    const passwordHash = await Bun.password.hash(password);
    const id = `u_${Date.now()}`;
    const defaultName = name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

    await db.insert(schema.users).values({
        id,
        name: defaultName,
        email,
        passwordHash,
        bio: 'New to Rithmic! 🌟',
        createdAt: new Date().toISOString(),
    });

    const token = generateToken(id);
    return c.json({ token, message: 'Registration successful' }, 201);
});

// POST /api/auth/login
auth.post('/login', async (c) => {
    const { email, password } = await c.req.json();

    if (!email || !password) {
        return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user by email
    const usersList = await db.select().from(schema.users).where(eq(schema.users.email, email));
    let user = usersList[0];

    if (!user) {
        return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password (existing users with "demo" password won't be hashed yet)
    let isMatch = false;
    if (user.passwordHash.startsWith('$argon2id') || user.passwordHash.startsWith('$2')) {
        // Hashed password
        isMatch = await Bun.password.verify(password, user.passwordHash);
    } else {
        // Fallback for old demo accounts
        isMatch = password === user.passwordHash;
    }

    if (!isMatch) {
        return c.json({ error: 'Invalid email or password' }, 401);
    }

    // ─── Daily Login Streak ──────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    let loginReward = 0;
    let loginStreak = user.loginStreak || 0;

    if (user.lastLoginDate !== today) {
        // Check if yesterday = streak continues
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (user.lastLoginDate === yesterday) {
            loginStreak++;
        } else if (user.lastLoginDate !== today) {
            loginStreak = 1; // reset
        }

        // Award login XP
        loginReward = XP_REWARDS.DAILY_LOGIN;
        if (loginStreak === 7) loginReward = XP_REWARDS.LOGIN_WEEK;
        else if (loginStreak === 14) loginReward = XP_REWARDS.LOGIN_FORTNIGHT;
        else if (loginStreak === 30) loginReward = XP_REWARDS.LOGIN_MONTH;

        awardXP(user.id, loginReward, 'Daily login');

        await db.update(schema.users).set({
            lastLoginDate: today,
            loginStreak,
        }).where(eq(schema.users.id, user.id));

        // Re-fetch after XP update
        const updatedUsers = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
        user = updatedUsers[0]!;
    }

    const token = generateToken(user.id);
    const { level, xpInLevel, xpToNext } = calculateLevel(user.xp);

    return c.json({
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            bio: user.bio,
            createdAt: user.createdAt,
            xp: user.xp,
            level,
            xpToNext,
            loginStreak,
        },
        loginReward,
    });
});

// GET /api/auth/me
auth.get('/me', async (c) => {
    const userId = c.get('userId' as never) as string;
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const userList = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    const user = userList[0];
    if (!user) return c.json({ error: 'User not found' }, 404);

    const { level, xpInLevel, xpToNext } = calculateLevel(user.xp);

    return c.json({
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        createdAt: user.createdAt,
        xp: user.xp,
        level,
        xpToNext,
        loginStreak: user.loginStreak,
    });
});

export default auth;
