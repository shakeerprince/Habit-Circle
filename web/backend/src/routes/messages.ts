import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, or, and, desc } from 'drizzle-orm';
import { notifyUser } from '../websocket';

const messages = new Hono();

// GET /api/messages — list conversations (unique users you've chatted with)
messages.get('/', async (c) => {
    const userId = c.get('userId' as never) as string;

    // Get all DMs involving this user
    const allDMs = await db.select().from(schema.directMessages)
        .where(or(eq(schema.directMessages.senderId, userId), eq(schema.directMessages.recipientId, userId)))
        .orderBy(desc(schema.directMessages.sentAt));

    const conversationMap = new Map<string, typeof allDMs[0]>();
    allDMs.forEach(dm => {
        const otherId = dm.senderId === userId ? dm.recipientId : dm.senderId;
        if (!conversationMap.has(otherId)) conversationMap.set(otherId, dm);
    });

    const conversations = await Promise.all(Array.from(conversationMap.entries()).map(async ([otherId, lastMsg]) => {
        const usersFound = await db.select().from(schema.users).where(eq(schema.users.id, otherId));
        const user = usersFound[0];
        const unreadCount = allDMs.filter(dm => dm.senderId === otherId && dm.recipientId === userId && !dm.isRead).length;

        return {
            userId: otherId,
            name: user?.name || 'Unknown User',
            bio: user?.bio || '',
            avatarUrl: user?.avatarUrl,
            lastMessage: lastMsg.message,
            lastMessageAt: lastMsg.sentAt,
            unreadCount,
        };
    }));

    return c.json(conversations);
});

// GET /api/messages/:otherId — message history with a user
messages.get('/:otherId', async (c) => {
    const userId = c.get('userId' as never) as string;
    const otherId = c.req.param('otherId');

    const history = await db.select().from(schema.directMessages)
        .where(
            or(
                and(eq(schema.directMessages.senderId, userId), eq(schema.directMessages.recipientId, otherId)),
                and(eq(schema.directMessages.senderId, otherId), eq(schema.directMessages.recipientId, userId)),
            )
        )
        .orderBy(schema.directMessages.sentAt);

    // Mark as read
    await db.update(schema.directMessages)
        .set({ isRead: true })
        .where(and(eq(schema.directMessages.senderId, otherId), eq(schema.directMessages.recipientId, userId)));

    const usersFound = await db.select().from(schema.users).where(eq(schema.users.id, otherId));
    const user = usersFound[0];

    return c.json({
        otherUser: {
            id: otherId,
            name: user?.name || 'Unknown User',
            bio: user?.bio || '',
        },
        messages: history
    });
});

// POST /api/messages/:receiverId — send a DM
messages.post('/:receiverId', async (c) => {
    const userId = c.get('userId' as never) as string;
    const receiverId = c.req.param('receiverId');
    const { message } = await c.req.json();

    if (!receiverId || !message) return c.json({ error: 'Receiver and message required' }, 400);

    const id = crypto.randomUUID();
    const newMsg = {
        id,
        senderId: userId,
        recipientId: receiverId,
        message,
        sentAt: new Date().toISOString(),
        isRead: false,
    };

    await db.insert(schema.directMessages).values(newMsg);

    // Broadcast via WebSockets to recipient
    notifyUser(receiverId, 'new_dm', newMsg);

    return c.json(newMsg, 201);
});

export default messages;
