// Pi Network 用户认证 API
const PiNetworkAPI = require('./pi-network.js');

// 初始化Pi Network API
const piAPI = new PiNetworkAPI();

// 用户数据存储 (实际项目中应使用数据库)
let users = new Map();
let gameStats = new Map();

// 验证用户并获取/创建用户数据
async function authenticateUser(accessToken) {
  try {
    // 从Pi Network获取用户信息
    const userResult = await piAPI.getUserInfo(accessToken);
    
    if (!userResult.success) {
      return {
        success: false,
        error: '无法验证Pi Network用户'
      };
    }

    const piUser = userResult.user;
    const userId = piUser.uid;

    // 检查用户是否已存在
    if (!users.has(userId)) {
      // 创建新用户
      const newUser = {
        uid: userId,
        username: piUser.username,
        accessToken: accessToken,
        balance: 0, // Pi余额
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      users.set(userId, newUser);

      // 初始化游戏统计
      const initialStats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        monthlyScore: 100, // 月度积分从100开始
        rank: 0
      };
      gameStats.set(userId, initialStats);
    } else {
      // 更新现有用户的登录时间和访问令牌
      const existingUser = users.get(userId);
      existingUser.lastLoginAt = new Date().toISOString();
      existingUser.accessToken = accessToken;
      users.set(userId, existingUser);
    }

    const user = users.get(userId);
    const stats = gameStats.get(userId);

    return {
      success: true,
      user: {
        uid: user.uid,
        username: user.username,
        balance: user.balance,
        stats: stats
      }
    };

  } catch (error) {
    console.error('用户认证失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 更新游戏统计
function updateGameStats(userId, result) {
  if (!gameStats.has(userId)) {
    return false;
  }

  const stats = gameStats.get(userId);
  stats.totalGames++;

  switch (result) {
    case 'win':
      stats.wins++;
      stats.monthlyScore += 1;
      break;
    case 'loss':
      stats.losses++;
      stats.monthlyScore -= 1;
      break;
    case 'draw':
      stats.draws++;
      break;
  }

  // 计算胜率
  stats.winRate = stats.totalGames > 0 ? 
    Math.round((stats.wins / stats.totalGames) * 100) : 0;

  gameStats.set(userId, stats);
  return true;
}

// 获取排行榜
function getLeaderboard() {
  const eligibleUsers = [];
  
  for (const [userId, stats] of gameStats.entries()) {
    if (stats.totalGames >= 60) { // 最少60场游戏才能上榜
      const user = users.get(userId);
      eligibleUsers.push({
        username: user.username,
        totalGames: stats.totalGames,
        winRate: stats.winRate,
        monthlyScore: stats.monthlyScore
      });
    }
  }

  // 按月度积分排序
  eligibleUsers.sort((a, b) => b.monthlyScore - a.monthlyScore);
  
  // 添加排名
  eligibleUsers.forEach((user, index) => {
    user.rank = index + 1;
  });

  return eligibleUsers.slice(0, 100); // 返回前100名
}

// 导出函数
module.exports = {
  authenticateUser,
  updateGameStats,
  getLeaderboard,
  users,
  gameStats
};
