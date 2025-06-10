// Vercel Serverless Function - 排行榜
let users = new Map();

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type = 'score', limit = 10 } = req.query;
    
    // 如果没有用户数据，返回模拟排行榜
    if (users.size === 0) {
      const mockLeaderboard = [
        { rank: 1, userId: 'user1', username: '棋圣大师', totalGames: 22, wins: 21, winRate: 95, score: 2150 },
        { rank: 2, userId: 'user2', username: '五子高手', totalGames: 27, wins: 25, winRate: 93, score: 2050 },
        { rank: 3, userId: 'user3', username: '连珠达人', totalGames: 29, wins: 26, winRate: 90, score: 1950 },
        { rank: 4, userId: 'user4', username: '黑白传说', totalGames: 28, wins: 24, winRate: 86, score: 1850 },
        { rank: 5, userId: 'user5', username: '智慧之星', totalGames: 27, wins: 23, winRate: 85, score: 1750 },
        { rank: 6, userId: 'user6', username: '棋道高手', totalGames: 25, wins: 20, winRate: 80, score: 1650 },
        { rank: 7, userId: 'user7', username: '五子王者', totalGames: 25, wins: 19, winRate: 76, score: 1550 },
        { rank: 8, userId: 'user8', username: '连珠专家', totalGames: 25, wins: 18, winRate: 72, score: 1450 },
        { rank: 9, userId: 'user9', username: '黑白精英', totalGames: 25, wins: 17, winRate: 68, score: 1350 },
        { rank: 10, userId: 'user10', username: '棋局达人', totalGames: 25, wins: 16, winRate: 64, score: 1250 }
      ];
      
      return res.json({
        success: true,
        leaderboard: mockLeaderboard.slice(0, parseInt(limit)),
        mock: true
      });
    }
    
    let sortedUsers = Array.from(users.values())
      .filter(user => user.stats.totalGames >= 5);
    
    if (type === 'score') {
      sortedUsers.sort((a, b) => b.stats.score - a.stats.score);
    } else if (type === 'winRate') {
      sortedUsers.sort((a, b) => b.stats.winRate - a.stats.winRate);
    }
    
    const leaderboard = sortedUsers.slice(0, parseInt(limit)).map((user, index) => ({
      rank: index + 1,
      userId: user.piUserId,
      username: user.username,
      totalGames: user.stats.totalGames,
      wins: user.stats.wins,
      winRate: user.stats.winRate,
      score: user.stats.score
    }));
    
    res.json({
      success: true,
      leaderboard: leaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard'
    });
  }
}
