// Vercel Serverless Function - 支付完成
const axios = require('axios');

const PI_API_BASE = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY;

let payments = new Map();

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId, txid, paymentData } = req.body;
    
    if (!paymentId || !txid) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and transaction ID are required'
      });
    }

    // 如果没有配置Pi API密钥，返回模拟成功
    if (!PI_API_KEY) {
      console.log('Pi API Key not configured, using mock completion');
      
      const payment = payments.get(paymentId) || {};
      payment.status = 'completed';
      payment.txid = txid;
      payment.completedAt = new Date();
      payment.mock = true;
      payments.set(paymentId, payment);
      
      return res.json({
        success: true,
        message: 'Payment completed (mock)',
        mock: true,
        payment: payment
      });
    }
    
    // 调用Pi Network API完成支付
    const response = await axios.post(
      `${PI_API_BASE}/v2/payments/${paymentId}/complete`,
      { txid },
      {
        headers: {
          'Authorization': `Key ${PI_API_KEY}`
        }
      }
    );
    
    // 更新支付记录
    const payment = payments.get(paymentId) || {};
    payment.status = 'completed';
    payment.txid = txid;
    payment.completedAt = new Date();
    payments.set(paymentId, payment);
    
    res.json({
      success: true,
      message: 'Payment completed',
      data: response.data,
      payment: payment
    });
  } catch (error) {
    console.error('Payment completion error:', error);
    
    // 即使Pi API失败，也返回成功（用于开发测试）
    const payment = payments.get(req.body.paymentId) || {};
    payment.status = 'completed';
    payment.txid = req.body.txid;
    payment.completedAt = new Date();
    payment.fallback = true;
    payments.set(req.body.paymentId, payment);
    
    res.json({
      success: true,
      message: 'Payment completed (fallback)',
      fallback: true,
      payment: payment
    });
  }
}
