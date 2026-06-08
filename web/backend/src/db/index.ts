import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use DATABASE_URL from .env
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
    console.error("❌ DATABASE_URL is not defined. Please set it in your .env or deployment settings.");
    if (process.env.NODE_ENV === 'production') {
        throw new Error("DATABASE_URL is missing in production environment");
    }
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export { schema };
