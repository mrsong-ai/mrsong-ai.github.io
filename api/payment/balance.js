// 查询用户余额API
const users = require('../data/users');

export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing userId parameter' 
      });
      return;
    }

    // 验证用户存在
    const user = users.get(userId);
    if (!user) {
      res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
      return;
    }

    // 获取用户余额和相关信息
    const balance = user.balance || 0;
    const totalSpent = user.stats?.totalSpent || 0;
    const totalRecharged = user.rechargeHistory ? 
      user.rechargeHistory.reduce((sum, record) => sum + record.amount, 0) : 0;

    // 获取最近的交易记录
    const recentRecharges = user.rechargeHistory ? 
      user.rechargeHistory.slice(-5).reverse() : [];
    const recentConsumes = user.consumeHistory ? 
      user.consumeHistory.slice(-10).reverse() : [];

    res.json({
      success: true,
      balance: {
        current: balance,
        totalRecharged: totalRecharged,
        totalSpent: totalSpent,
        netBalance: totalRecharged - totalSpent
      },
      history: {
        recentRecharges: recentRecharges,
        recentConsumes: recentConsumes
      },
      stats: {
        undoCount: user.stats?.undoCount || 0,
        newGameCount: user.stats?.newGameCount || 0,
        lastRechargeAt: user.lastRechargeAt || null
      },
      message: 'Balance retrieved successfully'
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance'
    });
  }
}
