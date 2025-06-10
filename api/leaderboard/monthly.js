// 月度排行榜API
const users = require("../data/users");

export default function handler(req, res) {
  // 设置CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  try {
    // 获取当前月份
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 筛选符合条件的用户进行月度排名
    const eligibleUsers = Array.from(users.values())
      .filter((user) => {
        // 必须有至少60局对局才能参与排名
        return user.stats.totalGames >= 60;
      })
      .map((user) => ({
        userId: user.piUserId,
        username: user.username,
        score: user.stats.score,
        totalGames: user.stats.totalGames,
        wins: user.stats.wins,
        losses: user.stats.losses,
        draws: user.stats.draws,
        winRate: user.stats.winRate,
        lastActive: user.lastActive,
      }))
      .sort((a, b) => {
        // 先按分数排序（从高到低）
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // 分数相同时按胜率排序
        if (b.winRate !== a.winRate) {
          return b.winRate - a.winRate;
        }
        // 胜率也相同时按总游戏数排序（更活跃的玩家排前面）
        return b.totalGames - a.totalGames;
      });

    // 添加排名
    const rankedUsers = eligibleUsers.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    // 计算统计信息
    const stats = {
      totalEligibleUsers: eligibleUsers.length,
      totalUsers: users.size,
      averageScore:
        eligibleUsers.length > 0
          ? Math.round(
              eligibleUsers.reduce((sum, user) => sum + user.score, 0) /
                eligibleUsers.length
            )
          : 0,
      highestScore: eligibleUsers.length > 0 ? eligibleUsers[0].score : 0,
      month: currentMonth,
      year: currentYear,
      minGamesRequired: 60,
    };

    // 分级奖励建议
    const rewardTiers = calculateRewardTiers(rankedUsers);

    res.json({
      success: true,
      leaderboard: rankedUsers.slice(0, 100), // 只返回前100名
      stats: stats,
      rewardTiers: rewardTiers,
      message: `${currentYear}年${currentMonth}月排行榜`,
    });
  } catch (error) {
    console.error("Monthly leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get monthly leaderboard",
    });
  }
}

// 计算奖励分级
function calculateRewardTiers(rankedUsers) {
  const totalUsers = rankedUsers.length;

  if (totalUsers === 0) {
    return [];
  }

  const tiers = [];

  // 冠军（第1名）
  if (totalUsers >= 1) {
    tiers.push({
      tier: "冠军",
      rank: "第1名",
      users: rankedUsers.slice(0, 1),
      reward: "🏆 月度冠军奖章 + 特殊称号 + Pi币奖励",
      description: "月度最强玩家",
      paymentSchedule: "次日发放",
    });
  }

  // 亚军季军（第2-3名）
  if (totalUsers >= 3) {
    tiers.push({
      tier: "亚军季军",
      rank: "第2-3名",
      users: rankedUsers.slice(1, 3),
      reward: "🥈🥉 优秀玩家奖章 + Pi币奖励",
      description: "表现优异的玩家",
      paymentSchedule: "次日发放",
    });
  }

  // 前10名
  if (totalUsers >= 10) {
    tiers.push({
      tier: "前十强",
      rank: "第4-10名",
      users: rankedUsers.slice(3, 10),
      reward: "🎖️ 精英玩家徽章",
      description: "月度精英玩家",
    });
  }

  // 前20%
  const top20Percent = Math.max(10, Math.floor(totalUsers * 0.2));
  if (totalUsers > 10 && top20Percent > 10) {
    tiers.push({
      tier: "优秀玩家",
      rank: `前${Math.round(20)}%`,
      users: rankedUsers.slice(10, top20Percent),
      reward: "⭐ 优秀玩家认证",
      description: "月度优秀表现",
    });
  }

  // 参与奖（完成60局以上的所有玩家）
  tiers.push({
    tier: "参与奖",
    rank: "所有符合条件玩家",
    users: rankedUsers,
    reward: "🎁 参与纪念品",
    description: "感谢积极参与游戏",
    paymentSchedule: "次日发放",
  });

  return tiers;
}
