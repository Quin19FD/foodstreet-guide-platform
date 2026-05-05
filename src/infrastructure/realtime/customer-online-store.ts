type CustomerOnlineStore = {
    // đếm user
  socketsByUserId: Map<string, Set<string>>;
  // xử lý khi socket disconnect để xóa userId khỏi socketsByUserId
  userIdBySocketId: Map<string, string>;
};

declare global {
  // eslint-disable-next-line no-var
  var __customerOnlineStore: CustomerOnlineStore | undefined;
}

// Lấy danh sách socketId của userId, nếu chưa có thì tạo mới một Set
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

// Đăng ký socketId cho userId, trả về tổng số user đang online
export function registerCustomerSocket(userId: string, socketId: string): number {
  const current = store.socketsByUserId.get(userId) ?? new Set<string>();
  current.add(socketId);
  store.socketsByUserId.set(userId, current);
  store.userIdBySocketId.set(socketId, userId);
  return store.socketsByUserId.size;
}

// Hủy đăng ký socketId cho userId, trả về tổng số user đang online
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
