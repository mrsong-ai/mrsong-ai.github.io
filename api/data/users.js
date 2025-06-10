// 用户数据存储 (内存存储，生产环境应使用数据库)
class UserStore {
  constructor() {
    this.users = new Map();
    this.initTestData();
  }

  // 初始化测试数据
  initTestData() {
    // 添加一个测试用户
    this.users.set('test_user_17495400', {
      id: 'test_user_17495400',
      username: 'TestUser',
      walletAddress: '',
      balance: 10.0, // 初始余额10 Pi
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        totalSpent: 0,
        undoCount: 0,
        newGameCount: 0
      },
      rechargeHistory: [
        {
          id: 'recharge_001',
          amount: 10.0,
          timestamp: new Date().toISOString(),
          status: 'completed',
          txId: 'test_tx_001'
        }
      ],
      consumeHistory: [],
      gameHistory: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      lastRechargeAt: new Date().toISOString()
    });
  }

  // 获取用户
  get(userId) {
    return this.users.get(userId);
  }

  // 设置用户
  set(userId, userData) {
    this.users.set(userId, userData);
    return userData;
  }

  // 创建新用户
  create(userId, initialData = {}) {
    const defaultUser = {
      id: userId,
      username: initialData.username || `User_${userId.slice(-6)}`,
      walletAddress: initialData.walletAddress || '',
      balance: 0,
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        totalSpent: 0,
        undoCount: 0,
        newGameCount: 0
      },
      rechargeHistory: [],
      consumeHistory: [],
      gameHistory: [],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      lastRechargeAt: null
    };

    const user = { ...defaultUser, ...initialData };
    this.users.set(userId, user);
    return user;
  }

  // 更新用户余额
  updateBalance(userId, amount, type = 'recharge') {
    const user = this.get(userId);
    if (!user) return null;

    if (type === 'recharge') {
      user.balance += amount;
      user.rechargeHistory.push({
        id: `recharge_${Date.now()}`,
        amount: amount,
        timestamp: new Date().toISOString(),
        status: 'completed',
        txId: `tx_${Date.now()}`
      });
      user.lastRechargeAt = new Date().toISOString();
    } else if (type === 'consume') {
      if (user.balance >= amount) {
        user.balance -= amount;
        user.stats.totalSpent += amount;
        user.consumeHistory.push({
          id: `consume_${Date.now()}`,
          amount: amount,
          type: type,
          timestamp: new Date().toISOString()
        });
      } else {
        return null; // 余额不足
      }
    }

    this.set(userId, user);
    return user;
  }

  // 检查用户是否存在，不存在则创建
  ensureUser(userId, initialData = {}) {
    let user = this.get(userId);
    if (!user) {
      user = this.create(userId, initialData);
    }
    return user;
  }

  // 获取所有用户（用于排行榜）
  getAllUsers() {
    return Array.from(this.users.values());
  }

  // 删除用户
  delete(userId) {
    return this.users.delete(userId);
  }

  // 清空所有数据
  clear() {
    this.users.clear();
    this.initTestData();
  }
}

// 创建全局实例
const userStore = new UserStore();

module.exports = userStore;
