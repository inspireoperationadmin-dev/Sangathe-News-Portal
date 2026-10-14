// src/lib/prisma.ts
import { PrismaClient as NodePrismaClient } from "@prisma/client";
// Workers cannot run Prisma's native engine; this entry point ships the WebAssembly engine instead.
import { PrismaClient as WasmPrismaClient } from "@prisma/client/wasm";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

// Cloudflare Workers cannot open raw TCP sockets, so Neon is reached through
// the serverless driver adapter. Any other database (for example the local
// Docker Postgres) keeps using Prisma's normal engine.
const isWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

type PrismaClient = NodePrismaClient;
const PrismaClientImpl = (isWorkers ? WasmPrismaClient : NodePrismaClient) as typeof NodePrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function usesNeon(url: string | undefined) {
  if (!url) return false;
  try {
    return new URL(url).hostname.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

function createClient() {
  const url = process.env.DATABASE_URL;
  const log: ("error" | "warn")[] = process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];
  if (isWorkers && !url) {
    throw new Error("DATABASE_URL is not configured in the Cloudflare Worker runtime variables.");
  }
  if (isWorkers && !usesNeon(url)) {
    throw new Error("Cloudflare deployment requires a valid Neon DATABASE_URL ending in .neon.tech.");
  }
  if (usesNeon(url)) {
    const pool = new Pool({ connectionString: url });
    return new PrismaClientImpl({ adapter: new PrismaNeon(pool), log });
  }
  return new PrismaClientImpl({ log });
}

function createPrisma(): PrismaClient {
  if (!isWorkers) {
    globalForPrisma.prisma ??= createClient();
    return globalForPrisma.prisma;
  }
  // Workers must not share database sockets between requests, so each
  // access gets a fresh client (cheap with a driver adapter: no engine process).
  return new Proxy({} as PrismaClient, {
    get(_target, property) {
      const client = createClient();
      const value = (client as unknown as Record<string | symbol, unknown>)[property];
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}

export const prisma = createPrisma();
