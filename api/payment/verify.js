// 验证Pi币支付状态API
const users = require('../data/users');
const { paymentOrders } = require('./create');

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
    const { orderId, transactionHash } = req.body;

    if (!orderId) {
      res.status(400).json({ 
        success: false, 
        message: 'Missing orderId' 
      });
      return;
    }

    // 查找订单
    const order = paymentOrders.get(orderId);
    if (!order) {
      res.status(404).json({ 
        success: false, 
        message: 'Payment order not found' 
      });
      return;
    }

    // 检查订单是否过期
    if (new Date() > new Date(order.expiresAt)) {
      order.status = 'expired';
      res.status(400).json({ 
        success: false, 
        message: 'Payment order has expired' 
      });
      return;
    }

    // 如果提供了交易哈希，验证交易
    if (transactionHash) {
      const verificationResult = await verifyPiTransaction(transactionHash, order);
      
      if (verificationResult.success) {
        // 更新订单状态
        order.status = 'completed';
        order.transactionHash = transactionHash;
        order.completedAt = new Date().toISOString();

        // 更新用户余额
        const user = users.get(order.userId);
        if (user) {
          if (!user.balance) {
            user.balance = 0;
          }
          user.balance += order.amount;
          user.lastRechargeAt = new Date().toISOString();
          
          // 记录充值历史
          if (!user.rechargeHistory) {
            user.rechargeHistory = [];
          }
          user.rechargeHistory.push({
            orderId: order.orderId,
            amount: order.amount,
            transactionHash: transactionHash,
            timestamp: order.completedAt
          });
        }

        res.json({
          success: true,
          order: order,
          newBalance: user ? user.balance : 0,
          message: 'Payment verified and balance updated'
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: verificationResult.message || 'Transaction verification failed' 
        });
      }
    } else {
      // 只查询订单状态，不验证交易
      res.json({
        success: true,
        order: order,
        message: 'Order status retrieved'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
}

// 验证Pi Network交易（模拟实现）
async function verifyPiTransaction(transactionHash, order) {
  try {
    // 这里应该调用Pi Network的API来验证交易
    // 由于Pi Network的API可能还在开发中，这里提供一个模拟实现
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 模拟验证逻辑
    if (transactionHash && transactionHash.length >= 32) {
      // 模拟成功的验证
      return {
        success: true,
        verified: true,
        amount: order.amount,
        sender: 'user_wallet_address',
        receiver: order.receiverAddress,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        message: 'Invalid transaction hash format'
      };
    }
    
    /* 真实的Pi Network API调用示例：
    const piApiResponse = await fetch(`https://api.minepi.com/v2/payments/${transactionHash}`, {
      headers: {
        'Authorization': `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const transactionData = await piApiResponse.json();
    
    // 验证交易详情
    if (transactionData.amount === order.amount && 
        transactionData.to_address === order.receiverAddress &&
        transactionData.status === 'completed') {
      return {
        success: true,
        verified: true,
        ...transactionData
      };
    } else {
      return {
        success: false,
        message: 'Transaction details do not match order'
      };
    }
    */
    
  } catch (error) {
    console.error('Pi transaction verification error:', error);
    return {
      success: false,
      message: 'Failed to verify transaction with Pi Network'
    };
  }
}
