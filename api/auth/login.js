// Vercel Serverless Function - 用户认证
const axios = require("axios");

// Pi Network API配置
const PI_API_BASE = "https://api.minepi.com";

// 模拟数据库（生产环境建议使用真实数据库）
let users = new Map();

// 工具函数：验证Pi Network访问令牌
async function verifyPiUser(accessToken) {
  try {
    const response = await axios.get(`${PI_API_BASE}/v2/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Invalid access token");
  }
}

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
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: "Access token is required",
      });
    }

    // 在开发环境中，如果是模拟token，直接返回模拟用户
    if (accessToken.startsWith("mock_token_")) {
      const mockUser = {
        piUserId: "test_user_" + Date.now(),
        username: "测试玩家" + Math.floor(Math.random() * 1000),
        stats: {
          totalGames: Math.floor(Math.random() * 50),
          wins: Math.floor(Math.random() * 30),
          losses: Math.floor(Math.random() * 20),
          draws: Math.floor(Math.random() * 5),
          winRate: 0,
          score: Math.floor(Math.random() * 1000),
          rank: Math.floor(Math.random() * 100) + 1,
        },
        createdAt: new Date(),
        lastActive: new Date(),
      };

      mockUser.stats.winRate =
        mockUser.stats.totalGames > 0
          ? Math.round((mockUser.stats.wins / mockUser.stats.totalGames) * 100)
          : 0;

      return res.json({
        success: true,
        user: mockUser,
        message: "Mock login successful",
      });
    }

    // 验证Pi Network访问令牌
    const piUser = await verifyPiUser(accessToken);

    // 查找或创建用户
    let user = users.get(piUser.uid);
    if (!user) {
      user = {
        piUserId: piUser.uid,
        username: piUser.username,
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
      users.set(piUser.uid, user);
    } else {
      user.lastActive = new Date();
    }

    res.json({
      success: true,
      user: user,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
}
