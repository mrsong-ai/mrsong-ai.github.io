const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
    origin: ['http://localhost:8000', 'http://localhost:3000', 'https://mrsong-ai.github.io'],
    credentials: true
}));
app.use(express.json());

// 数据存储路径
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

// 确保数据目录存在
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// 读取JSON文件
async function readJsonFile(filePath, defaultValue = []) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return defaultValue;
    }
}

// 写入JSON文件
async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Pi Gomoku Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 获取排行榜
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await readJsonFile(LEADERBOARD_FILE, []);
        const users = await readJsonFile(USERS_FILE, []);
        const games = await readJsonFile(GAMES_FILE, []);

        // 转换为前端期望的格式
        const formattedLeaderboard = leaderboard.map((user, index) => ({
            rank: index + 1,
            userId: user.uid,
            username: user.username,
            totalGames: user.gamesPlayed,
            wins: user.gamesWon,
            winRate: user.winRate,
            isCurrentUser: false // 前端会自己判断
        }));

        res.json({
            success: true,
            leaderboard: formattedLeaderboard.slice(0, 100), // 返回前100名
            totalUsers: users.length,
            totalGames: games.length,
            activeUsers: users.filter(u => u.stats.gamesPlayed > 0).length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get leaderboard',
            error: error.message
        });
    }
});

// 用户认证
app.post('/api/auth/login', async (req, res) => {
    try {
        const { accessToken, user } = req.body;
        
        if (!accessToken || !user || !user.uid) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const users = await readJsonFile(USERS_FILE, []);
        let existingUser = users.find(u => u.uid === user.uid);

        if (!existingUser) {
            // 创建新用户
            existingUser = {
                uid: user.uid,
                username: user.username || `Player_${user.uid.slice(-6)}`,
                walletAddress: user.walletAddress || '',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                stats: {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    gamesLost: 0,
                    winRate: 0
                }
            };
            users.push(existingUser);
        } else {
            // 更新最后登录时间
            existingUser.lastLoginAt = new Date().toISOString();
        }

        await writeJsonFile(USERS_FILE, users);

        res.json({
            success: true,
            message: 'Login successful',
            user: existingUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// 获取用户数据
app.get('/api/users', async (req, res) => {
    try {
        const users = await readJsonFile(USERS_FILE, []);
        res.json({
            success: true,
            data: users.map(user => ({
                uid: user.uid,
                username: user.username,
                stats: user.stats,
                lastLoginAt: user.lastLoginAt
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
});

// 获取游戏数据
app.get('/api/games', async (req, res) => {
    try {
        const games = await readJsonFile(GAMES_FILE, []);
        res.json({
            success: true,
            data: games.slice(-20) // 返回最近20场游戏
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get games',
            error: error.message
        });
    }
});

// 保存游戏结果
app.post('/api/games', async (req, res) => {
    try {
        const { playerUid, result, moves, duration } = req.body;
        
        if (!playerUid || !result) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const games = await readJsonFile(GAMES_FILE, []);
        const users = await readJsonFile(USERS_FILE, []);
        
        // 保存游戏记录
        const gameRecord = {
            id: Date.now().toString(),
            playerUid,
            result, // 'win', 'lose', 'draw'
            moves: moves || [],
            duration: duration || 0,
            timestamp: new Date().toISOString()
        };
        
        games.push(gameRecord);
        await writeJsonFile(GAMES_FILE, games);

        // 更新用户统计
        let user = users.find(u => u.uid === playerUid);
        if (!user) {
            // 如果用户不存在，创建新用户
            user = {
                uid: playerUid,
                username: `Player_${playerUid.slice(-6)}`,
                walletAddress: '',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                stats: {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    gamesLost: 0,
                    winRate: 0
                }
            };
            users.push(user);
        }

        // 更新统计数据
        user.stats.gamesPlayed++;
        if (result === 'win') {
            user.stats.gamesWon++;
        } else if (result === 'lose') {
            user.stats.gamesLost++;
        }
        user.stats.winRate = user.stats.gamesPlayed > 0
            ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100)
            : 0;

        await writeJsonFile(USERS_FILE, users);

        // 更新排行榜
        await updateLeaderboard(users);

        res.json({
            success: true,
            message: 'Game saved successfully',
            gameId: gameRecord.id,
            userStats: {
                totalGames: user.stats.gamesPlayed,
                wins: user.stats.gamesWon,
                losses: user.stats.gamesLost,
                draws: 0, // 暂时不支持平局
                winRate: user.stats.winRate,
                username: user.username
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to save game',
            error: error.message
        });
    }
});

// 更新排行榜
async function updateLeaderboard(users) {
    const leaderboard = users
        .filter(user => user.stats.gamesPlayed > 0)
        .map(user => ({
            uid: user.uid,
            username: user.username,
            gamesPlayed: user.stats.gamesPlayed,
            gamesWon: user.stats.gamesWon,
            winRate: user.stats.winRate,
            lastActive: user.lastLoginAt
        }))
        .sort((a, b) => {
            // 先按胜率排序，再按游戏数量排序
            if (b.winRate !== a.winRate) {
                return b.winRate - a.winRate;
            }
            return b.gamesWon - a.gamesWon;
        });
    
    await writeJsonFile(LEADERBOARD_FILE, leaderboard);
}

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl
    });
});

// 启动服务器
async function startServer() {
    try {
        await ensureDataDir();
        
        app.listen(PORT, () => {
            console.log(`🚀 Pi Gomoku Backend server is running on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🎮 API base URL: http://localhost:${PORT}/api`);
            console.log(`🕒 Started at: ${new Date().toISOString()}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
