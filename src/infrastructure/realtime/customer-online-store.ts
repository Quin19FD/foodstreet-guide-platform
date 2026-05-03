type CustomerOnlineStore = {
  socketsByUserId: Map<string, Set<string>>;
  userIdBySocketId: Map<string, string>;
};

declare global {
  // eslint-disable-next-line no-var
  var __customerOnlineStore: CustomerOnlineStore | undefined;
}

function createStore(): CustomerOnlineStore {
  return {
    socketsByUserId: new Map<string, Set<string>>(),
    userIdBySocketId: new Map<string, string>(),
  };
}

const store = globalThis.__customerOnlineStore ?? createStore();

if (process.env.NODE_ENV !== "production") {
  globalThis.__customerOnlineStore = store;
}

export function registerCustomerSocket(userId: string, socketId: string): number {
  const current = store.socketsByUserId.get(userId) ?? new Set<string>();
  current.add(socketId);
  store.socketsByUserId.set(userId, current);
  store.userIdBySocketId.set(socketId, userId);
  return store.socketsByUserId.size;
}

export function unregisterCustomerSocket(socketId: string): number {
  const userId = store.userIdBySocketId.get(socketId);
  if (!userId) return store.socketsByUserId.size;

  store.userIdBySocketId.delete(socketId);
  const current = store.socketsByUserId.get(userId);
  if (!current) return store.socketsByUserId.size;

  current.delete(socketId);
  if (current.size === 0) {
    store.socketsByUserId.delete(userId);
  }

  return store.socketsByUserId.size;
}

export function getOnlineCustomerCount(): number {
  return store.socketsByUserId.size;
}
