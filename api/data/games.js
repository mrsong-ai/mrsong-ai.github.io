// 游戏数据存储 (内存存储，生产环境应使用数据库)
class GameStore {
  constructor() {
    this.games = new Map();
    this.dailyStats = new Map();
    this.monthlyStats = new Map();
  }

  // 创建新游戏记录
  createGame(gameData) {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const game = {
      id: gameId,
      playerId: gameData.playerId,
      playerName: gameData.playerName || 'Anonymous',
      gameMode: gameData.gameMode || 'vs_ai',
      startTime: new Date().toISOString(),
      endTime: null,
      result: null, // 'win', 'lose', 'draw'
      moves: [],
      aiLevel: gameData.aiLevel || 3,
      status: 'playing', // 'playing', 'finished', 'abandoned'
      undoCount: 0,
      restartCount: 0,
      totalMoves: 0,
      duration: 0
    };

    this.games.set(gameId, game);
    return game;
  }

  // 获取游戏记录
  getGame(gameId) {
    return this.games.get(gameId);
  }

  // 更新游戏记录
  updateGame(gameId, updates) {
    const game = this.games.get(gameId);
    if (!game) return null;

    Object.assign(game, updates);
    this.games.set(gameId, game);
    return game;
  }

  // 结束游戏
  finishGame(gameId, result, finalMoves = []) {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.endTime = new Date().toISOString();
    game.result = result;
    game.status = 'finished';
    game.moves = finalMoves;
    game.totalMoves = finalMoves.length;
    
    // 计算游戏时长
    const startTime = new Date(game.startTime);
    const endTime = new Date(game.endTime);
    game.duration = Math.floor((endTime - startTime) / 1000); // 秒

    this.games.set(gameId, game);
    
    // 更新统计数据
    this.updateStats(game);
    
    return game;
  }

  // 更新统计数据
  updateStats(game) {
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().substring(0, 7);
    
    // 更新日统计
    if (!this.dailyStats.has(today)) {
      this.dailyStats.set(today, {
        date: today,
        totalGames: 0,
        players: new Set(),
        results: { wins: 0, losses: 0, draws: 0 }
      });
    }
    
    const dailyStat = this.dailyStats.get(today);
    dailyStat.totalGames++;
    dailyStat.players.add(game.playerId);
    if (game.result) {
      dailyStat.results[game.result + 's'] = (dailyStat.results[game.result + 's'] || 0) + 1;
    }
    
    // 更新月统计
    if (!this.monthlyStats.has(month)) {
      this.monthlyStats.set(month, {
        month: month,
        totalGames: 0,
        players: new Set(),
        results: { wins: 0, losses: 0, draws: 0 }
      });
    }
    
    const monthlyStat = this.monthlyStats.get(month);
    monthlyStat.totalGames++;
    monthlyStat.players.add(game.playerId);
    if (game.result) {
      monthlyStat.results[game.result + 's'] = (monthlyStat.results[game.result + 's'] || 0) + 1;
    }
  }

  // 获取用户游戏历史
  getUserGames(playerId, limit = 50) {
    const userGames = Array.from(this.games.values())
      .filter(game => game.playerId === playerId)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, limit);
    
    return userGames;
  }

  // 获取用户统计
  getUserStats(playerId) {
    const userGames = this.getUserGames(playerId);
    const stats = {
      totalGames: userGames.length,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      averageDuration: 0,
      totalUndos: 0,
      totalRestarts: 0
    };

    if (userGames.length === 0) return stats;

    let totalDuration = 0;
    userGames.forEach(game => {
      if (game.result === 'win') stats.wins++;
      else if (game.result === 'lose') stats.losses++;
      else if (game.result === 'draw') stats.draws++;
      
      totalDuration += game.duration || 0;
      stats.totalUndos += game.undoCount || 0;
      stats.totalRestarts += game.restartCount || 0;
    });

    stats.winRate = stats.totalGames > 0 ? (stats.wins / stats.totalGames * 100).toFixed(1) : 0;
    stats.averageDuration = stats.totalGames > 0 ? Math.floor(totalDuration / stats.totalGames) : 0;

    return stats;
  }

  // 获取排行榜数据
  getLeaderboard(type = 'monthly', limit = 100) {
    const allUsers = new Map();
    
    // 收集所有用户的游戏数据
    Array.from(this.games.values()).forEach(game => {
      if (!game.playerId || game.status !== 'finished') return;
      
      if (!allUsers.has(game.playerId)) {
        allUsers.set(game.playerId, {
          playerId: game.playerId,
          playerName: game.playerName,
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          lastGameTime: null
        });
      }
      
      const user = allUsers.get(game.playerId);
      user.totalGames++;
      if (game.result === 'win') user.wins++;
      else if (game.result === 'lose') user.losses++;
      else if (game.result === 'draw') user.draws++;
      
      if (!user.lastGameTime || new Date(game.endTime) > new Date(user.lastGameTime)) {
        user.lastGameTime = game.endTime;
      }
    });

    // 计算胜率并排序
    const leaderboard = Array.from(allUsers.values())
      .filter(user => user.totalGames >= 20) // 至少20局游戏才能上榜
      .map(user => {
        user.winRate = user.totalGames > 0 ? (user.wins / user.totalGames * 100).toFixed(1) : 0;
        return user;
      })
      .sort((a, b) => {
        // 先按胜率排序，胜率相同按总游戏数排序
        if (parseFloat(b.winRate) !== parseFloat(a.winRate)) {
          return parseFloat(b.winRate) - parseFloat(a.winRate);
        }
        return b.totalGames - a.totalGames;
      })
      .slice(0, limit)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    return leaderboard;
  }

  // 清空所有数据
  clear() {
    this.games.clear();
    this.dailyStats.clear();
    this.monthlyStats.clear();
  }
}

// 创建全局实例
const gameStore = new GameStore();

module.exports = gameStore;
