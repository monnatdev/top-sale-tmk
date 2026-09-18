import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Supabase pooler (transaction mode) ไม่รองรับ prepared statements
const client = postgres(env.DATABASE_URL, { prepare: false, max: 10 });

export const db = drizzle(client, { schema });
export type Db = typeof db;
// transaction handle — query function รับ DbClient เพื่อใช้ได้ทั้งใน/นอก transaction
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type DbClient = Db | Tx;
