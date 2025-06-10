// Pi Network 支付处理 API
const PiNetworkAPI = require('./pi-network.js');
const { users } = require('./auth.js');

// 初始化Pi Network API
const piAPI = new PiNetworkAPI();

// 支付记录存储
let paymentRecords = new Map();

// 处理悔棋支付
async function processUndoPayment(userId, paymentId) {
  try {
    // 验证支付
    const verifyResult = await piAPI.verifyPayment(paymentId);
    
    if (!verifyResult.success || !verifyResult.verified) {
      return {
        success: false,
        error: '支付验证失败'
      };
    }

    const payment = verifyResult.payment;
    
    // 检查支付金额是否正确
    if (payment.amount !== 0.1) {
      return {
        success: false,
        error: '支付金额不正确'
      };
    }

    // 记录支付
    paymentRecords.set(paymentId, {
      userId: userId,
      type: 'undo',
      amount: payment.amount,
      status: 'completed',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: '悔棋支付成功'
    };

  } catch (error) {
    console.error('悔棋支付处理失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 处理重新开始游戏支付
async function processNewGamePayment(userId, paymentId) {
  try {
    // 验证支付
    const verifyResult = await piAPI.verifyPayment(paymentId);
    
    if (!verifyResult.success || !verifyResult.verified) {
      return {
        success: false,
        error: '支付验证失败'
      };
    }

    const payment = verifyResult.payment;
    
    // 检查支付金额是否正确
    if (payment.amount !== 0.1) {
      return {
        success: false,
        error: '支付金额不正确'
      };
    }

    // 记录支付
    paymentRecords.set(paymentId, {
      userId: userId,
      type: 'new_game',
      amount: payment.amount,
      status: 'completed',
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      message: '重新开始支付成功'
    };

  } catch (error) {
    console.error('重新开始支付处理失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 创建支付请求
async function createPaymentRequest(type, userId) {
  try {
    let amount, memo;
    
    switch (type) {
      case 'undo':
        amount = 0.1;
        memo = '五子棋游戏 - 悔棋';
        break;
      case 'new_game':
        amount = 0.1;
        memo = '五子棋游戏 - 重新开始';
        break;
      default:
        return {
          success: false,
          error: '不支持的支付类型'
        };
    }

    const metadata = {
      game: 'gomoku',
      type: type,
      userId: userId
    };

    const paymentResult = await piAPI.createPayment(amount, memo, metadata);
    
    if (!paymentResult.success) {
      return {
        success: false,
        error: '创建支付请求失败'
      };
    }

    return {
      success: true,
      payment: paymentResult.payment
    };

  } catch (error) {
    console.error('创建支付请求失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 检查用户余额
function checkUserBalance(userId) {
  if (!users.has(userId)) {
    return {
      success: false,
      error: '用户不存在'
    };
  }

  const user = users.get(userId);
  return {
    success: true,
    balance: user.balance || 0
  };
}

// 获取支付历史
function getPaymentHistory(userId) {
  const userPayments = [];
  
  for (const [paymentId, record] of paymentRecords.entries()) {
    if (record.userId === userId) {
      userPayments.push({
        paymentId: paymentId,
        type: record.type,
        amount: record.amount,
        status: record.status,
        timestamp: record.timestamp
      });
    }
  }

  // 按时间倒序排列
  userPayments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return userPayments;
}

// 计算月度奖励
function calculateMonthlyRewards() {
  // 计算总收入
  let totalRevenue = 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  for (const [paymentId, record] of paymentRecords.entries()) {
    const paymentDate = new Date(record.timestamp);
    if (paymentDate.getMonth() === currentMonth && 
        paymentDate.getFullYear() === currentYear &&
        record.status === 'completed') {
      totalRevenue += record.amount;
    }
  }

  // 50%用于奖励
  const rewardPool = totalRevenue * 0.5;
  
  return {
    totalRevenue: totalRevenue,
    rewardPool: rewardPool,
    rewards: {
      first: rewardPool * 0.5,   // 第一名50%
      second: rewardPool * 0.3,  // 第二名30%
      third: rewardPool * 0.2    // 第三名20%
    }
  };
}

// 导出函数
module.exports = {
  processUndoPayment,
  processNewGamePayment,
  createPaymentRequest,
  checkUserBalance,
  getPaymentHistory,
  calculateMonthlyRewards,
  paymentRecords
};
