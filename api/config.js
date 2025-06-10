// Pi Network API 配置
const PI_CONFIG = {
  // Pi Network 应用配置
  APP_ID: 'gomoku-5d5b20e8b1d13f8',
  API_KEY: 'albf8hbmuxne42bqa2fonmisdhr01w13l8zm0srvvm4xkeqistgv1z7oj5urxhuk',
  
  // API 端点
  API_BASE_URL: 'https://api.minepi.com',
  
  // 支付配置
  PAYMENT_CONFIG: {
    // 游戏内支付价格 (Pi)
    UNDO_MOVE_COST: 0.1,        // 悔棋费用
    NEW_GAME_COST: 0.1,         // 重新开始费用
    PREMIUM_FEATURES_COST: 0.5,  // 高级功能费用
    
    // 月度奖励配置
    MONTHLY_REWARD_POOL_PERCENTAGE: 0.5, // 50%利润用于奖励
    TOP_PLAYER_REWARDS: {
      FIRST: 0.5,   // 第一名获得50%
      SECOND: 0.3,  // 第二名获得30%
      THIRD: 0.2    // 第三名获得20%
    }
  },
  
  // 游戏配置
  GAME_CONFIG: {
    MIN_GAMES_FOR_RANKING: 60,  // 参与排名最少游戏数
    POINTS_PER_WIN: 1,          // 胜利得分
    POINTS_PER_LOSS: -1,        // 失败扣分
    POINTS_PER_DRAW: 0          // 平局得分
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PI_CONFIG;
} else {
  window.PI_CONFIG = PI_CONFIG;
}
