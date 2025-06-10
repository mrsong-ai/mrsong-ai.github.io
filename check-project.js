#!/usr/bin/env node

/**
 * Pi五子棋游戏项目完备性检查脚本
 * 使用方法: node check-project.js
 */

const fs = require("fs");
const path = require("path");

// ⭐ 核心文件列表（必须存在）
const coreFiles = [
  "public/index.html", // 📄 主游戏页面
  "package.json", // 📦 项目配置和依赖
  "vercel.json", // 🚀 Vercel部署配置
  ".gitignore", // 🚫 Git忽略文件配置
  "项目说明.md", // 📚 项目说明文档
  "部署指南.md", // 🚀 部署指南
];

// 🔧 功能文件列表（推荐保留）
const functionalFiles = [
  "开源许可证.txt", // 📜 开源许可证
  ".env.example", // 🔧 环境变量示例
  "pi-app.json", // 🥧 Pi Network应用配置
  "api/auth/login.js", // 🔑 Pi Network登录接口
  "api/games/create.js", // 🆕 创建游戏接口
  "api/leaderboard.js", // 🏆 排行榜数据接口
  "public/sounds/game-start.mp3", // 🎵 游戏开始音效
  "public/sounds/move.mp3", // 🎵 落子音效
  "public/sounds/victory.mp3", // 🎵 胜利音效
];

// 🛠️ 工具文件列表（可选但建议保留）
const toolFiles = [
  "deploy.sh", // 🐧 Linux/Mac部署脚本
  "deploy.bat", // 🪟 Windows部署脚本
  "check-project.js", // 🔍 项目完备性检查脚本
];

console.log("🔍 检查Pi五子棋游戏项目完备性...\n");

let allGood = true;
let warnings = 0;

// 检查核心文件
console.log("⭐ 检查核心文件（必须存在）:");
coreFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file.split("/").pop()} - ${file}`);
  } else {
    console.log(`❌ ${file.split("/").pop()} - ${file} - 缺失！`);
    allGood = false;
  }
});

// 检查功能文件
console.log("\n🔧 检查功能文件（推荐保留）:");
functionalFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file.split("/").pop()} - ${file}`);
  } else {
    console.log(`⚠️  ${file.split("/").pop()} - ${file} - 建议添加`);
    warnings++;
  }
});

// 检查工具文件
console.log("\n🛠️ 检查工具文件（可选但建议保留）:");
toolFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file.split("/").pop()} - ${file}`);
  } else {
    console.log(`⚠️  ${file.split("/").pop()} - ${file} - 可选文件`);
    // 工具文件缺失不计入警告
  }
});

// 检查package.json内容
console.log("\n📦 检查package.json配置:");
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

  if (packageJson.name) {
    console.log(`✅ 项目名称: ${packageJson.name}`);
  } else {
    console.log("❌ 缺少项目名称");
    allGood = false;
  }

  if (packageJson.version) {
    console.log(`✅ 版本号: ${packageJson.version}`);
  } else {
    console.log("❌ 缺少版本号");
    allGood = false;
  }

  if (packageJson.scripts && packageJson.scripts.deploy) {
    console.log("✅ 部署脚本已配置");
  } else {
    console.log("⚠️  建议添加部署脚本");
    warnings++;
  }
} catch (error) {
  console.log("❌ package.json格式错误");
  allGood = false;
}

// 检查vercel.json配置
console.log("\n🌐 检查Vercel配置:");
try {
  const vercelJson = JSON.parse(fs.readFileSync("vercel.json", "utf8"));

  if (vercelJson.version === 2) {
    console.log("✅ Vercel版本配置正确");
  } else {
    console.log("⚠️  建议使用Vercel版本2");
    warnings++;
  }

  if (vercelJson.builds) {
    console.log("✅ 构建配置已设置");
  } else {
    console.log("❌ 缺少构建配置");
    allGood = false;
  }
} catch (error) {
  console.log("❌ vercel.json格式错误");
  allGood = false;
}

// 检查主页面文件
console.log("\n🎮 检查游戏文件:");
if (fs.existsSync("public/index.html")) {
  const htmlContent = fs.readFileSync("public/index.html", "utf8");

  if (htmlContent.includes("Pi.init")) {
    console.log("✅ Pi SDK已集成");
  } else {
    console.log("⚠️  Pi SDK可能未正确集成");
    warnings++;
  }

  if (htmlContent.includes("data-i18n")) {
    console.log("✅ 多语言支持已实现");
  } else {
    console.log("⚠️  多语言支持可能不完整");
    warnings++;
  }

  if (htmlContent.includes("createPayment")) {
    console.log("✅ Pi支付功能已实现");
  } else {
    console.log("⚠️  Pi支付功能可能未实现");
    warnings++;
  }
}

// 总结
console.log("\n📊 检查结果:");
if (allGood && warnings === 0) {
  console.log("🎉 项目完备！可以开始部署了！");
} else if (allGood) {
  console.log(`✅ 项目基本完备，有 ${warnings} 个建议改进项`);
  console.log("💡 可以部署，但建议完善推荐功能");
} else {
  console.log("❌ 项目不完备，请修复必需文件后再部署");
}

console.log("\n📖 详细部署指南请查看: 部署指南.md");
console.log("🚀 准备好后运行: npm run deploy 或 ./deploy.sh");
