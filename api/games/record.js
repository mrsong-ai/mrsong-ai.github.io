// Vercel Serverless Function - 游戏记录
let users = new Map();
let games = [];

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 处理预检请求
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, username, gameResult, gameData } = req.body;

    if (!userId || !gameResult) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // 记录游戏
    const game = {
      id: Date.now().toString(),
      userId,
      username,
      result: gameResult,
      gameData,
      createdAt: new Date(),
    };
    games.push(game);

    // 更新用户统计
    let user = users.get(userId);
    if (!user) {
      // 如果用户不存在，创建新用户
      user = {
        piUserId: userId,
        username: username || "匿名玩家",
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          score: 100, // 新用户从100分开始
          rank: 0,
        },
        createdAt: new Date(),
        lastActive: new Date(),
      };
      users.set(userId, user);
    }

    // 更新统计数据
    user.stats.totalGames++;
    if (gameResult === "win") {
      user.stats.wins++;
      user.stats.score += 1; // 胜利 +1分
    } else if (gameResult === "loss") {
      user.stats.losses++;
      // 只有分数大于0时才扣分
      if (user.stats.score > 0) {
        user.stats.score -= 1;
      }
    } else if (gameResult === "draw") {
      user.stats.draws++;
      // 平局不加不减分
    }

    // 计算胜率
    user.stats.winRate =
      user.stats.totalGames > 0
        ? Math.round((user.stats.wins / user.stats.totalGames) * 100)
        : 0;

    // 更新排名（需要最低60局对局才能参与排名）
    const sortedUsers = Array.from(users.values())
      .filter((u) => u.stats.totalGames >= 60)
      .sort((a, b) => {
        // 先按分数排序，分数相同时按胜率排序
        if (b.stats.score !== a.stats.score) {
          return b.stats.score - a.stats.score;
        }
        return b.stats.winRate - a.stats.winRate;
      });

    sortedUsers.forEach((u, index) => {
      u.stats.rank = index + 1;
    });

    res.json({
      success: true,
      game: game,
      userStats: user.stats,
      message: "Game recorded successfully",
    });
  } catch (error) {
    console.error("Record game error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record game",
    });
  }
}
