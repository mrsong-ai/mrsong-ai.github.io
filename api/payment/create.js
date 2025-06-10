// 创建Pi币支付订单API
const users = require('../data/users');

// 模拟的支付订单存储（实际应用中应使用数据库）
const paymentOrders = new Map();

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
    const { userId, amount, purpose } = req.body;

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

    // 生成订单ID
    const orderId = generateOrderId();
    const timestamp = new Date().toISOString();

    // 创建支付订单
    const paymentOrder = {
      orderId: orderId,
      userId: userId,
      username: user.username,
      amount: parseFloat(amount),
      purpose: purpose, // 'recharge' | 'undo' | 'newgame'
      status: 'pending', // 'pending' | 'completed' | 'failed' | 'expired'
      createdAt: timestamp,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟过期
      piPaymentId: null, // Pi Network支付ID
      transactionHash: null, // 区块链交易哈希
      receiverAddress: process.env.PI_RECEIVER_WALLET || 'YOUR_PI_WALLET_ADDRESS_HERE'
    };

    // 保存订单
    paymentOrders.set(orderId, paymentOrder);

    // 返回支付信息
    res.json({
      success: true,
      order: {
        orderId: orderId,
        amount: paymentOrder.amount,
        purpose: paymentOrder.purpose,
        receiverAddress: paymentOrder.receiverAddress,
        expiresAt: paymentOrder.expiresAt,
        qrCodeData: generatePaymentQRCode(paymentOrder)
      },
      message: 'Payment order created successfully'
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
}

// 生成订单ID
function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `PI_${timestamp}_${random}`.toUpperCase();
}

// 生成支付二维码数据
function generatePaymentQRCode(order) {
  // Pi Network支付URL格式
  const paymentUrl = `pi://pay?` + 
    `amount=${order.amount}&` +
    `memo=${encodeURIComponent(`游戏充值-${order.orderId}`)}&` +
    `recipient=${order.receiverAddress}`;
  
  return {
    url: paymentUrl,
    displayText: `向 ${order.receiverAddress} 转账 ${order.amount} π`,
    memo: `游戏充值-${order.orderId}`
  };
}

// 导出订单存储以供其他模块使用
module.exports = { paymentOrders };
