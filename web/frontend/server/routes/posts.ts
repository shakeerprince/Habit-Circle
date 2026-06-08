import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, desc, and, or } from 'drizzle-orm';
import { notifyUpvote, notifyComment } from '../lib/notifications';
import { awardXP, XP_REWARDS } from '../lib/xp';

const posts = new Hono();

// GET /api/posts
posts.get('/', async (c) => {
    const userId = c.get('userId' as never) as string;

    const rows = await db.select({
        id: schema.posts.id,
        authorId: schema.posts.authorId,
        title: schema.posts.title,
        body: schema.posts.body,
        habitName: schema.posts.habitName,
        upvotes: schema.posts.upvotes,
        downvotes: schema.posts.downvotes,
        commentCount: schema.posts.commentCount,
        createdAt: schema.posts.createdAt,
        authorName: schema.users.name,
        authorBio: schema.users.bio,
    })
        .from(schema.posts)
        .leftJoin(schema.users, eq(schema.posts.authorId, schema.users.id))
        .orderBy(desc(schema.posts.createdAt));

    const userVotes = await db.select().from(schema.postVotes).where(eq(schema.postVotes.userId, userId));
    const voteMap = new Map(userVotes.map(v => [v.postId, v.direction]));

    const result = rows.map(r => ({ ...r, userVote: voteMap.get(r.id) || 0 }));

    return c.json(result);
});

// POST /api/posts
posts.post('/', async (c) => {
    const userId = c.get('userId' as never) as string;
    const body = await c.req.json();

    const id = crypto.randomUUID();
    await db.insert(schema.posts).values({
        id,
        authorId: userId,
        title: body.title,
        body: body.body,
        habitName: body.habitName,
        createdAt: new Date().toISOString(),
    });

    awardXP(userId, XP_REWARDS.CREATE_POST, 'Shared a progress post');

    return c.json({ id, message: 'Post created' }, 201);
});

// GET /api/posts/:id
posts.get('/:id', async (c) => {
    const userId = c.get('userId' as never) as string;
    const id = c.req.param('id');
    const postsFound = await db.select().from(schema.posts).where(eq(schema.posts.id, id));
    const post = postsFound[0];
    if (!post) return c.json({ error: 'Post not found' }, 404);

    const votes = await db.select().from(schema.postVotes).where(and(eq(schema.postVotes.postId, id), eq(schema.postVotes.userId, userId)));
    const userVote = votes[0]?.direction || 0;

    return c.json({ ...post, userVote });
});

// POST /api/posts/:id/vote
posts.post('/:id/vote', async (c) => {
    const userId = c.get('userId' as never) as string;
    const postId = c.req.param('id');
    const { direction } = await c.req.json();

    const postsFound = await db.select().from(schema.posts).where(eq(schema.posts.id, postId));
    const post = postsFound[0];
    if (!post) return c.json({ error: 'Post not found' }, 404);

    const votesFound = await db.select().from(schema.postVotes)
        .where(and(eq(schema.postVotes.postId, postId), eq(schema.postVotes.userId, userId)));
    const existingVote = votesFound[0];

    const currentDir = existingVote ? existingVote.direction : 0;
    if (currentDir === direction) {
        return c.json({ upvotes: post.upvotes, downvotes: post.downvotes, userVote: direction });
    }

    let newUpvotes = post.upvotes;
    let newDownvotes = post.downvotes;

    if (currentDir === 1) newUpvotes--;
    if (currentDir === -1) newDownvotes--;

    if (direction === 1) newUpvotes++;
    if (direction === -1) newDownvotes++;

    await db.update(schema.posts)
        .set({ upvotes: newUpvotes, downvotes: newDownvotes })
        .where(eq(schema.posts.id, postId));

    if (direction === 0) {
        if (existingVote) await db.delete(schema.postVotes).where(eq(schema.postVotes.id, existingVote.id));
    } else {
        if (existingVote) {
            await db.update(schema.postVotes).set({ direction }).where(eq(schema.postVotes.id, existingVote.id));
        } else {
            await db.insert(schema.postVotes).values({
                id: crypto.randomUUID(),
                postId,
                userId,
                direction
            });
        }
    }

    if (direction === 1 && currentDir !== 1) {
        const usersFound = await db.select().from(schema.users).where(eq(schema.users.id, userId));
        const voter = usersFound[0];
        if (voter && post.authorId !== userId) {
            notifyUpvote(post.authorId, voter.name, post.title);
        }
    }

    return c.json({ upvotes: newUpvotes, downvotes: newDownvotes, userVote: direction });
});

// GET /api/posts/:id/comments
posts.get('/:id/comments', async (c) => {
    const postId = c.req.param('id');
    const rows = await db.select({
        id: schema.comments.id,
        authorId: schema.comments.authorId,
        body: schema.comments.body,
        createdAt: schema.comments.createdAt,
        authorName: schema.users.name,
        authorAvatar: schema.users.avatarUrl,
    })
        .from(schema.comments)
        .leftJoin(schema.users, eq(schema.comments.authorId, schema.users.id))
        .where(eq(schema.comments.postId, postId))
        .orderBy(schema.comments.createdAt);

    return c.json(rows);
});

// POST /api/posts/:id/comments
posts.post('/:id/comments', async (c) => {
    const userId = c.get('userId' as never) as string;
    const postId = c.req.param('id');
    const { body } = await c.req.json();

    const id = crypto.randomUUID();
    await db.insert(schema.comments).values({
        id,
        postId,
        authorId: userId,
        body,
        createdAt: new Date().toISOString(),
    });

    const postsFound = await db.select().from(schema.posts).where(eq(schema.posts.id, postId));
    const post = postsFound[0];
    if (post) {
        await db.update(schema.posts).set({ commentCount: post.commentCount + 1 }).where(eq(schema.posts.id, postId));

        // Notify author
        const usersFound = await db.select().from(schema.users).where(eq(schema.users.id, userId));
        const commenter = usersFound[0];
        if (commenter && post.authorId !== userId) {
            notifyComment(post.authorId, commenter.name, post.title);
        }
    }

    awardXP(userId, XP_REWARDS.ADD_COMMENT, 'Commented on a post');

    return c.json({ id, message: 'Comment added' }, 201);
});

export default posts;
