type Presence = {
  userId: string;
  lastSeenAt: number;
};

type CustomerOnlineStore = {
  presenceBySessionId: Map<string, Presence>;
  sessionIdsByUserId: Map<string, Set<string>>;
};

declare global {
  // eslint-disable-next-line no-var
  var __customerOnlineStore: CustomerOnlineStore | undefined;
  // eslint-disable-next-line no-var
  var __lastPublishedOnlineCount: number | undefined;
}

const CUSTOMER_ONLINE_TTL_MS = 45_000;
const CUSTOMER_ONLINE_TTL_SECONDS = Math.floor(CUSTOMER_ONLINE_TTL_MS / 1000);
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/+$/, "");
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const ONLINE_COUNTER_NAMESPACE =
  process.env.ONLINE_COUNTER_NAMESPACE?.trim() ||
  [
    process.env.NODE_ENV?.trim(),
    process.env.VERCEL_ENV?.trim(),
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim(),
    process.env.VERCEL_URL?.trim(),
  ]
    .filter((value): value is string => Boolean(value))
    .join(":") ||
  "local";
const ONLINE_SESSIONS_ZSET_KEY = `foodstreet:online:${ONLINE_COUNTER_NAMESPACE}:sessions`;
const ONLINE_SESSION_USERS_HASH_KEY = `foodstreet:online:${ONLINE_COUNTER_NAMESPACE}:session_users`;
const ONLINE_USER_SESSION_COUNTS_HASH_KEY = `foodstreet:online:${ONLINE_COUNTER_NAMESPACE}:user_session_counts`;
const ONLINE_ACTIVE_USERS_SET_KEY = `foodstreet:online:${ONLINE_COUNTER_NAMESPACE}:active_users`;
const ONLINE_COUNT_CHANNEL = `foodstreet:online:${ONLINE_COUNTER_NAMESPACE}:count`;

const HEARTBEAT_LUA = `
local sessionsKey = KEYS[1]
local sessionUsersKey = KEYS[2]
local userCountsKey = KEYS[3]
local activeUsersKey = KEYS[4]
local nowScore = tonumber(ARGV[1])
local cutoffScore = tonumber(ARGV[2])
local sessionId = ARGV[3]
local userId = ARGV[4]
local ttlSeconds = tonumber(ARGV[5])

local function dec_user(uid)
  local nextCount = redis.call("HINCRBY", userCountsKey, uid, -1)
  if nextCount <= 0 then
    redis.call("HDEL", userCountsKey, uid)
    redis.call("SREM", activeUsersKey, uid)
  end
end

local function prune_expired()
  local expiredSessionIds = redis.call("ZRANGEBYSCORE", sessionsKey, "-inf", cutoffScore)
  for _, sid in ipairs(expiredSessionIds) do
    redis.call("ZREM", sessionsKey, sid)
    local uid = redis.call("HGET", sessionUsersKey, sid)
    if uid then
      redis.call("HDEL", sessionUsersKey, sid)
      dec_user(uid)
    end
  end
end

prune_expired()

local prevUserId = redis.call("HGET", sessionUsersKey, sessionId)
if not prevUserId then
  redis.call("HSET", sessionUsersKey, sessionId, userId)
  local nextCount = redis.call("HINCRBY", userCountsKey, userId, 1)
  if nextCount == 1 then
    redis.call("SADD", activeUsersKey, userId)
  end
elseif prevUserId ~= userId then
  dec_user(prevUserId)
  redis.call("HSET", sessionUsersKey, sessionId, userId)
  local nextCount = redis.call("HINCRBY", userCountsKey, userId, 1)
  if nextCount == 1 then
    redis.call("SADD", activeUsersKey, userId)
  end
end

redis.call("ZADD", sessionsKey, nowScore, sessionId)

redis.call("EXPIRE", sessionsKey, ttlSeconds * 4)
redis.call("EXPIRE", sessionUsersKey, ttlSeconds * 4)
redis.call("EXPIRE", userCountsKey, ttlSeconds * 4)
redis.call("EXPIRE", activeUsersKey, ttlSeconds * 4)

return redis.call("SCARD", activeUsersKey)
`;

const OFFLINE_LUA = `
local sessionsKey = KEYS[1]
local sessionUsersKey = KEYS[2]
local userCountsKey = KEYS[3]
local activeUsersKey = KEYS[4]
local cutoffScore = tonumber(ARGV[1])
local sessionId = ARGV[2]
local ttlSeconds = tonumber(ARGV[3])

local function dec_user(uid)
  local nextCount = redis.call("HINCRBY", userCountsKey, uid, -1)
  if nextCount <= 0 then
    redis.call("HDEL", userCountsKey, uid)
    redis.call("SREM", activeUsersKey, uid)
  end
end

local function prune_expired()
  local expiredSessionIds = redis.call("ZRANGEBYSCORE", sessionsKey, "-inf", cutoffScore)
  for _, sid in ipairs(expiredSessionIds) do
    redis.call("ZREM", sessionsKey, sid)
    local uid = redis.call("HGET", sessionUsersKey, sid)
    if uid then
      redis.call("HDEL", sessionUsersKey, sid)
      dec_user(uid)
    end
  end
end

prune_expired()

local uid = redis.call("HGET", sessionUsersKey, sessionId)
if uid then
  redis.call("HDEL", sessionUsersKey, sessionId)
  redis.call("ZREM", sessionsKey, sessionId)
  dec_user(uid)
end

redis.call("EXPIRE", sessionsKey, ttlSeconds * 4)
redis.call("EXPIRE", sessionUsersKey, ttlSeconds * 4)
redis.call("EXPIRE", userCountsKey, ttlSeconds * 4)
redis.call("EXPIRE", activeUsersKey, ttlSeconds * 4)

return redis.call("SCARD", activeUsersKey)
`;

const COUNT_LUA = `
local sessionsKey = KEYS[1]
local sessionUsersKey = KEYS[2]
local userCountsKey = KEYS[3]
local activeUsersKey = KEYS[4]
local cutoffScore = tonumber(ARGV[1])
local ttlSeconds = tonumber(ARGV[2])

local function dec_user(uid)
  local nextCount = redis.call("HINCRBY", userCountsKey, uid, -1)
  if nextCount <= 0 then
    redis.call("HDEL", userCountsKey, uid)
    redis.call("SREM", activeUsersKey, uid)
  end
end

local expiredSessionIds = redis.call("ZRANGEBYSCORE", sessionsKey, "-inf", cutoffScore)
for _, sid in ipairs(expiredSessionIds) do
  redis.call("ZREM", sessionsKey, sid)
  local uid = redis.call("HGET", sessionUsersKey, sid)
  if uid then
    redis.call("HDEL", sessionUsersKey, sid)
    dec_user(uid)
  end
end

redis.call("EXPIRE", sessionsKey, ttlSeconds * 4)
redis.call("EXPIRE", sessionUsersKey, ttlSeconds * 4)
redis.call("EXPIRE", userCountsKey, ttlSeconds * 4)
redis.call("EXPIRE", activeUsersKey, ttlSeconds * 4)

return redis.call("SCARD", activeUsersKey)
`;

function createStore(): CustomerOnlineStore {
  return {
    presenceBySessionId: new Map<string, Presence>(),
    sessionIdsByUserId: new Map<string, Set<string>>(),
  };
}

const store = globalThis.__customerOnlineStore ?? createStore();

if (process.env.NODE_ENV !== "production") {
  globalThis.__customerOnlineStore = store;
}

function detachSessionFromUser(userId: string, sessionId: string) {
  const sessions = store.sessionIdsByUserId.get(userId);
  if (!sessions) return;
  sessions.delete(sessionId);
  if (sessions.size === 0) {
    store.sessionIdsByUserId.delete(userId);
  }
}

function pruneExpiredSessions(nowMs: number) {
  for (const [sessionId, presence] of store.presenceBySessionId.entries()) {
    if (nowMs - presence.lastSeenAt <= CUSTOMER_ONLINE_TTL_MS) continue;
    store.presenceBySessionId.delete(sessionId);
    detachSessionFromUser(presence.userId, sessionId);
  }
}

function markCustomerOnlineInMemory(userId: string, sessionId: string): number {
  const nowMs = Date.now();
  pruneExpiredSessions(nowMs);

  const previous = store.presenceBySessionId.get(sessionId);
  if (previous && previous.userId !== userId) {
    detachSessionFromUser(previous.userId, sessionId);
  }

  store.presenceBySessionId.set(sessionId, { userId, lastSeenAt: nowMs });
  const sessions = store.sessionIdsByUserId.get(userId) ?? new Set<string>();
  sessions.add(sessionId);
  store.sessionIdsByUserId.set(userId, sessions);

  return store.sessionIdsByUserId.size;
}

function getOnlineCustomerCountInMemory(): number {
  pruneExpiredSessions(Date.now());
  return store.sessionIdsByUserId.size;
}

function markCustomerOfflineInMemory(sessionId: string): number {
  const presence = store.presenceBySessionId.get(sessionId);
  if (!presence) {
    pruneExpiredSessions(Date.now());
    return store.sessionIdsByUserId.size;
  }

  store.presenceBySessionId.delete(sessionId);
  detachSessionFromUser(presence.userId, sessionId);
  pruneExpiredSessions(Date.now());
  return store.sessionIdsByUserId.size;
}

function hasUpstashRedis(): boolean {
  return Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);
}

function parseCountFromResult(result: unknown): number | null {
  if (typeof result === "number" && Number.isFinite(result)) return result;
  if (typeof result === "string") {
    const parsed = Number.parseInt(result, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

async function runUpstashCommand(command: Array<string | number>): Promise<unknown | null> {
  if (!hasUpstashRedis()) return null;

  try {
    const response = await fetch(UPSTASH_REDIS_REST_URL as string, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });

    if (!response.ok) return null;
    const data = (await response.json().catch(() => null)) as { result?: unknown } | null;
    return data?.result ?? null;
  } catch {
    return null;
  }
}

async function runUpstashEval(
  script: string,
  keys: string[],
  args: Array<string | number>
): Promise<unknown | null> {
  return runUpstashCommand(["EVAL", script, keys.length.toString(), ...keys, ...args]);
}

async function publishOnlineCount(count: number): Promise<void> {
  if (globalThis.__lastPublishedOnlineCount === count) return;
  globalThis.__lastPublishedOnlineCount = count;
  await runUpstashCommand(["PUBLISH", ONLINE_COUNT_CHANNEL, count.toString()]);
}

export async function markCustomerOnline(userId: string, sessionId: string): Promise<number> {
  const nowSec = Math.floor(Date.now() / 1000);
  const cutoffSec = nowSec - CUSTOMER_ONLINE_TTL_SECONDS;

  const remoteResult = await runUpstashEval(
    HEARTBEAT_LUA,
    [
      ONLINE_SESSIONS_ZSET_KEY,
      ONLINE_SESSION_USERS_HASH_KEY,
      ONLINE_USER_SESSION_COUNTS_HASH_KEY,
      ONLINE_ACTIVE_USERS_SET_KEY,
    ],
    [nowSec.toString(), (cutoffSec - 1).toString(), sessionId, userId, CUSTOMER_ONLINE_TTL_SECONDS]
  );

  const remoteCount = parseCountFromResult(remoteResult);
  if (remoteCount !== null) {
    await publishOnlineCount(remoteCount);
    return remoteCount;
  }

  return markCustomerOnlineInMemory(userId, sessionId);
}

export async function markCustomerOffline(sessionId: string): Promise<number> {
  const nowSec = Math.floor(Date.now() / 1000);
  const cutoffSec = nowSec - CUSTOMER_ONLINE_TTL_SECONDS;

  const remoteResult = await runUpstashEval(
    OFFLINE_LUA,
    [
      ONLINE_SESSIONS_ZSET_KEY,
      ONLINE_SESSION_USERS_HASH_KEY,
      ONLINE_USER_SESSION_COUNTS_HASH_KEY,
      ONLINE_ACTIVE_USERS_SET_KEY,
    ],
    [(cutoffSec - 1).toString(), sessionId, CUSTOMER_ONLINE_TTL_SECONDS]
  );

  const remoteCount = parseCountFromResult(remoteResult);
  if (remoteCount !== null) {
    await publishOnlineCount(remoteCount);
    return remoteCount;
  }

  return markCustomerOfflineInMemory(sessionId);
}

export async function getOnlineCustomerCount(): Promise<number> {
  const nowSec = Math.floor(Date.now() / 1000);
  const cutoffSec = nowSec - CUSTOMER_ONLINE_TTL_SECONDS;

  const remoteResult = await runUpstashEval(
    COUNT_LUA,
    [
      ONLINE_SESSIONS_ZSET_KEY,
      ONLINE_SESSION_USERS_HASH_KEY,
      ONLINE_USER_SESSION_COUNTS_HASH_KEY,
      ONLINE_ACTIVE_USERS_SET_KEY,
    ],
    [(cutoffSec - 1).toString(), CUSTOMER_ONLINE_TTL_SECONDS]
  );

  const remoteCount = parseCountFromResult(remoteResult);
  if (remoteCount !== null) return remoteCount;

  return getOnlineCustomerCountInMemory();
}

export function getOnlineCountChannel(): string {
  return ONLINE_COUNT_CHANNEL;
}

export function isUpstashConfigured(): boolean {
  return hasUpstashRedis();
}

export function getUpstashConfig(): { url: string; token: string } | null {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;
  return {
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  };
}
