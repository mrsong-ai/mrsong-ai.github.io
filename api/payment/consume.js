// 消费Pi币API（悔棋、新游戏等）
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

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' });
    return;
  }

  try {
    const { userId, amount, purpose, gameData } = req.body;

    if (!userId || !amount || !purpose) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: userId, amount, purpose' 
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

    // 检查用户余额
    const currentBalance = user.balance || 0;
    const consumeAmount = parseFloat(amount);

    if (currentBalance < consumeAmount) {
      res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance',
        currentBalance: currentBalance,
        requiredAmount: consumeAmount
      });
      return;
    }

    // 验证消费目的和金额
    const validPurposes = {
      'undo': 0.1,      // 悔棋
      'newgame': 0.1,   // 新游戏
      'hint': 0.05,     // 提示（如果有的话）
      'premium': 1.0    // 高级功能（如果有的话）
    };

    if (!validPurposes.hasOwnProperty(purpose)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid purpose' 
      });
      return;
    }

    if (consumeAmount !== validPurposes[purpose]) {
      res.status(400).json({ 
        success: false, 
        message: `Invalid amount for ${purpose}. Expected: ${validPurposes[purpose]} π` 
      });
      return;
    }

    // 扣除余额
    user.balance -= consumeAmount;
    
    // 记录消费历史
    if (!user.consumeHistory) {
      user.consumeHistory = [];
    }
    
    const consumeRecord = {
      id: generateConsumeId(),
      purpose: purpose,
      amount: consumeAmount,
      timestamp: new Date().toISOString(),
      gameData: gameData || {},
      balanceAfter: user.balance
    };
    
    user.consumeHistory.push(consumeRecord);
    
    // 更新用户统计
    if (!user.stats.totalSpent) {
      user.stats.totalSpent = 0;
    }
    user.stats.totalSpent += consumeAmount;

    // 根据消费目的更新相关统计
    if (purpose === 'undo') {
      if (!user.stats.undoCount) {
        user.stats.undoCount = 0;
      }
      user.stats.undoCount++;
    } else if (purpose === 'newgame') {
      if (!user.stats.newGameCount) {
        user.stats.newGameCount = 0;
      }
      user.stats.newGameCount++;
    }

    res.json({
      success: true,
      consume: consumeRecord,
      newBalance: user.balance,
      message: `Successfully consumed ${consumeAmount} π for ${purpose}`
    });

  } catch (error) {
    console.error('Consume payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process consumption'
    });
  }
}

// 生成消费记录ID
function generateConsumeId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `CONSUME_${timestamp}_${random}`.toUpperCase();
}

// 获取消费目的的显示名称
function getPurposeDisplayName(purpose) {
  const names = {
    'undo': '悔棋',
    'newgame': '新游戏',
    'hint': '提示',
    'premium': '高级功能'
  };
  return names[purpose] || purpose;
}
