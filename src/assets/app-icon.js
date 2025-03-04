const fs = require('fs');
const { createCanvas } = require('canvas');

// 创建一个512x512的高分辨率图标
const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// 设置背景为透明
ctx.clearRect(0, 0, size, size);

// 绘制一个渐变圆形背景
const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
gradient.addColorStop(0, '#5a9eff');
gradient.addColorStop(1, '#3178e6');

ctx.beginPath();
ctx.arc(size/2, size/2, size/2 - 10, 0, Math.PI * 2);
ctx.fillStyle = gradient;
ctx.fill();

// 添加轻微的阴影效果
ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
ctx.shadowBlur = 15;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 5;

// 绘制剪贴板轮廓
const clipboardWidth = size * 0.6;
const clipboardHeight = size * 0.7;
const clipboardX = (size - clipboardWidth) / 2;
const clipboardY = (size - clipboardHeight) / 2 + size * 0.05;
const cornerRadius = size * 0.05;

// 剪贴板主体
ctx.beginPath();
ctx.roundRect(clipboardX, clipboardY, clipboardWidth, clipboardHeight, cornerRadius);
ctx.fillStyle = 'white';
ctx.fill();

// 重置阴影
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;

// 剪贴板顶部夹子
const clipWidth = clipboardWidth * 0.4;
const clipHeight = size * 0.08;
const clipX = (size - clipWidth) / 2;
const clipY = clipboardY - clipHeight / 2;

ctx.beginPath();
ctx.roundRect(clipX, clipY, clipWidth, clipHeight, cornerRadius);
ctx.fillStyle = '#e0e0e0';
ctx.fill();

// 绘制剪贴板内容线条
ctx.beginPath();
const lineStartX = clipboardX + clipboardWidth * 0.2;
const lineEndX = clipboardX + clipboardWidth * 0.8;
const lineStartY = clipboardY + clipboardHeight * 0.25;
const lineSpacing = clipboardHeight * 0.15;

for (let i = 0; i < 4; i++) {
  const y = lineStartY + i * lineSpacing;
  ctx.moveTo(lineStartX, y);
  ctx.lineTo(lineEndX, y);
}

ctx.strokeStyle = '#4a90e2';
ctx.lineWidth = size * 0.01;
ctx.stroke();

// 将图标保存为PNG文件
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('src/assets/icon.png', buffer);

console.log('美化的图标已生成: src/assets/icon.png');

// 创建一个适合菜单栏的小图标 (22x22像素)
const traySize = 22;
const trayCanvas = createCanvas(traySize, traySize);
const trayCtx = trayCanvas.getContext('2d');

// 设置背景为透明
trayCtx.clearRect(0, 0, traySize, traySize);

// 绘制一个简化的剪贴板图标
// 剪贴板主体
const trayClipboardWidth = traySize * 0.7;
const trayClipboardHeight = traySize * 0.8;
const trayClipboardX = (traySize - trayClipboardWidth) / 2;
const trayClipboardY = (traySize - trayClipboardHeight) / 2 + traySize * 0.05;
const trayCornerRadius = 1;

trayCtx.beginPath();
trayCtx.roundRect(trayClipboardX, trayClipboardY, trayClipboardWidth, trayClipboardHeight, trayCornerRadius);
trayCtx.fillStyle = 'black'; // 使用黑色，适合菜单栏

// 剪贴板顶部夹子
const trayClipWidth = trayClipboardWidth * 0.4;
const trayClipHeight = 2;
const trayClipX = (traySize - trayClipWidth) / 2;
const trayClipY = trayClipboardY - trayClipHeight / 2;

trayCtx.roundRect(trayClipX, trayClipY, trayClipWidth, trayClipHeight, 0.5);
trayCtx.fill();

// 绘制剪贴板内容线条
trayCtx.beginPath();
const trayLineStartX = trayClipboardX + 2;
const trayLineEndX = trayClipboardX + trayClipboardWidth - 2;
const trayLineStartY = trayClipboardY + 4;
const trayLineSpacing = 3;

for (let i = 0; i < 3; i++) {
  const y = trayLineStartY + i * trayLineSpacing;
  trayCtx.moveTo(trayLineStartX, y);
  trayCtx.lineTo(trayLineEndX, y);
}

trayCtx.strokeStyle = 'black';
trayCtx.lineWidth = 0.5;
trayCtx.stroke();

// 将菜单栏图标保存为PNG文件
const trayBuffer = trayCanvas.toBuffer('image/png');
fs.writeFileSync('src/assets/tray-icon.png', trayBuffer);

// 创建一个模板版本（仅黑白，适合macOS深色模式）
const trayTemplateCanvas = createCanvas(traySize, traySize);
const trayTemplateCtx = trayTemplateCanvas.getContext('2d');

// 设置背景为透明
trayTemplateCtx.clearRect(0, 0, traySize, traySize);

// 绘制一个简化的剪贴板图标（与上面相同，但使用白色）
trayTemplateCtx.beginPath();
trayTemplateCtx.roundRect(trayClipboardX, trayClipboardY, trayClipboardWidth, trayClipboardHeight, trayCornerRadius);
trayTemplateCtx.roundRect(trayClipX, trayClipY, trayClipWidth, trayClipHeight, 0.5);
trayTemplateCtx.fillStyle = 'white'; // 使用白色，适合模板图标
trayTemplateCtx.fill();

// 绘制剪贴板内容线条
trayTemplateCtx.beginPath();
for (let i = 0; i < 3; i++) {
  const y = trayLineStartY + i * trayLineSpacing;
  trayTemplateCtx.moveTo(trayLineStartX, y);
  trayTemplateCtx.lineTo(trayLineEndX, y);
}

trayTemplateCtx.strokeStyle = 'white';
trayTemplateCtx.lineWidth = 0.5;
trayTemplateCtx.stroke();

// 将模板图标保存为PNG文件
const trayTemplateBuffer = trayTemplateCanvas.toBuffer('image/png');
fs.writeFileSync('src/assets/tray-icon-template.png', trayTemplateBuffer);

console.log('菜单栏图标已生成: src/assets/tray-icon.png');
console.log('菜单栏模板图标已生成: src/assets/tray-icon-template.png');
