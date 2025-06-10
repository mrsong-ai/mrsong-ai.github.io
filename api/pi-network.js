// Pi Network API 集成
const PI_CONFIG = require('./config.js');

class PiNetworkAPI {
  constructor() {
    this.config = PI_CONFIG;
    this.baseURL = this.config.API_BASE_URL;
    this.apiKey = this.config.API_KEY;
    this.appId = this.config.APP_ID;
  }

  // 验证支付
  async verifyPayment(paymentId) {
    try {
      const response = await fetch(`${this.baseURL}/v2/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payment = await response.json();
      return {
        success: true,
        payment: payment,
        verified: payment.status === 'completed'
      };
    } catch (error) {
      console.error('支付验证失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 获取用户信息
  async getUserInfo(accessToken) {
    try {
      const response = await fetch(`${this.baseURL}/v2/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userInfo = await response.json();
      return {
        success: true,
        user: userInfo
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 创建支付请求
  async createPayment(amount, memo, metadata = {}) {
    try {
      const paymentData = {
        amount: amount,
        memo: memo,
        metadata: {
          ...metadata,
          app_id: this.appId
        }
      };

      const response = await fetch(`${this.baseURL}/v2/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payment = await response.json();
      return {
        success: true,
        payment: payment
      };
    } catch (error) {
      console.error('创建支付失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 导出API类
module.exports = PiNetworkAPI;
