/**
 * Pi五子棋游戏 - 创建游戏API
 * 处理新游戏创建和游戏状态管理
 */

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { userId, gameType = 'ai', difficulty = 'medium' } = req.body;

      // 验证必需参数
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // 创建新游戏
      const gameId = generateGameId();
      const game = {
        id: gameId,
        userId: userId,
        type: gameType,
        difficulty: difficulty,
        status: 'active',
        board: Array(15).fill().map(() => Array(15).fill(0)),
        currentPlayer: 'black', // 玩家先手
        moves: [],
        startTime: new Date().toISOString(),
        lastMoveTime: new Date().toISOString()
      };

      // 这里可以保存到数据库
      // 目前返回模拟数据
      return res.status(200).json({
        success: true,
        game: game,
        message: 'Game created successfully'
      });

    } else if (req.method === 'GET') {
      const { userId, gameId } = req.query;

      if (gameId) {
        // 获取特定游戏信息
        const game = await getGameById(gameId);
        if (!game) {
          return res.status(404).json({
            success: false,
            error: 'Game not found'
          });
        }
        return res.status(200).json({
          success: true,
          game: game
        });
      } else if (userId) {
        // 获取用户的活跃游戏
        const activeGames = await getActiveGamesByUser(userId);
        return res.status(200).json({
          success: true,
          games: activeGames
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'User ID or Game ID is required'
        });
      }
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('Game creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// 生成游戏ID
function generateGameId() {
  return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 模拟获取游戏信息（实际应用中应该从数据库获取）
async function getGameById(gameId) {
  // 模拟数据
  return {
    id: gameId,
    userId: 'test_user',
    type: 'ai',
    difficulty: 'medium',
    status: 'active',
    board: Array(15).fill().map(() => Array(15).fill(0)),
    currentPlayer: 'black',
    moves: [],
    startTime: new Date().toISOString(),
    lastMoveTime: new Date().toISOString()
  };
}

// 模拟获取用户活跃游戏（实际应用中应该从数据库获取）
async function getActiveGamesByUser(userId) {
  // 模拟数据
  return [
    {
      id: 'game_' + Date.now(),
      userId: userId,
      type: 'ai',
      difficulty: 'medium',
      status: 'active',
      startTime: new Date().toISOString(),
      lastMoveTime: new Date().toISOString()
    }
  ];
}
