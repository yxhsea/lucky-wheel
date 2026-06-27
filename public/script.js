// ===== 奖品配置 =====
const PRIZES = [
  { name: '奶茶一杯', emoji: '🧋', color: '#FF6B9D' },
  { name: '谢谢参与', emoji: '😅', color: '#DFE6E9' },
  { name: '电影票',   emoji: '🎬', color: '#FF9F43' },
  { name: '再来一次', emoji: '🔄', color: '#FECA57' },
  { name: '零食大礼包',emoji: '🍿', color: '#48DBFB' },
  { name: '谢谢参与', emoji: '😅', color: '#DFE6E9' },
  { name: '购物红包', emoji: '🧧', color: '#A29BFE' },
  { name: '神秘礼物', emoji: '🎁', color: '#FF6B9D' },
];

const SEG_COUNT = PRIZES.length;
const ARC = (2 * Math.PI) / SEG_COUNT;

// ===== DOM =====
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalEmoji = document.getElementById('modalEmoji');
const modalPrize = document.getElementById('modalPrize');
const modalBtn = document.getElementById('modalBtn');
const remainSpan = document.getElementById('remainCount');
const historyDiv = document.getElementById('historyList');
const confettiCanvas = document.getElementById('confettiCanvas');

const SIZE = canvas.width;
const RADIUS = SIZE / 2 - 6;
const CENTER = SIZE / 2;

// ===== 状态 =====
let currentRotation = 0;       // 当前旋转角度 (rad)
let spinning = false;
let remainingSpins = 8;
let history = [];

// ===== 绘制转盘 =====
function drawWheel(rotation) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  // 绘制每个扇区
  for (let i = 0; i < SEG_COUNT; i++) {
    const startAngle = rotation + i * ARC;
    const endAngle = startAngle + ARC;

    // 扇区底色
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = PRIZES[i].color;
    ctx.fill();

    // 边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 奖品文字 + emoji
    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(startAngle + ARC / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = i % 2 === 0 || PRIZES[i].color === '#DFE6E9' ? '#2d3436' : '#fff';
    ctx.font = 'bold 17px -apple-system, "PingFang SC", sans-serif';

    // emoji
    ctx.font = '26px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(PRIZES[i].emoji, RADIUS * 0.68, 6);

    // 文字
    ctx.font = 'bold 13px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(PRIZES[i].name, RADIUS * 0.68, 28);

    ctx.restore();
  }

  // 中心装饰圆
  const gradient = ctx.createRadialGradient(CENTER, CENTER, 0, CENTER, CENTER, 36);
  gradient.addColorStop(0, '#fff');
  gradient.addColorStop(0.6, '#f8f9fa');
  gradient.addColorStop(1, '#dfe6e9');
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 36, 0, 2 * Math.PI);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 中心文字
  ctx.fillStyle = '#FF6B9D';
  ctx.font = 'bold 20px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎡', CENTER, CENTER);
  ctx.textBaseline = 'alphabetic';
}

// ===== 旋转逻辑 =====
function getPrizeIndex(rotation) {
  // 指针在顶部 (0度 / 2pi)，扇区从 rotation 开始
  // 指针方向 = 向上 = -PI/2 (在 canvas 坐标中)
  const pointerAngle = (-Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
  const normalizedRotation = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const relativeAngle = ((pointerAngle - normalizedRotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const index = Math.floor(relativeAngle / ARC);
  return index % SEG_COUNT;
}

function spin() {
  if (spinning || remainingSpins <= 0) return;

  spinning = true;
  spinBtn.disabled = true;
  canvas.classList.add('spinning');
  remainingSpins--;
  remainSpan.textContent = remainingSpins;

  // 随机目标：至少转 5 圈 + 随机角度
  const extraTurns = 5 + Math.random() * 3;
  const targetAngle = currentRotation + extraTurns * 2 * Math.PI + Math.random() * 2 * Math.PI;

  const startRotation = currentRotation;
  const totalDelta = targetAngle - startRotation;
  const duration = 3500 + Math.random() * 1000; // 3.5~4.5s
  const startTime = performance.now();

  // 弹跳缓出
  function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  function animateWheel(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutBack(progress);

    currentRotation = startRotation + totalDelta * eased;
    drawWheel(currentRotation);

    // 嗒嗒声模拟 — 标记线经过指针
    if (progress < 0.85) {
      const tickProgress = (progress / 0.85);
      // 无实际音效，视觉上加速闪烁
    }

    if (progress < 1) {
      requestAnimationFrame(animateWheel);
    } else {
      // 完成
      currentRotation = targetAngle;
      drawWheel(currentRotation);
      canvas.classList.remove('spinning');
      spinning = false;
      spinBtn.disabled = false;

      const winIndex = getPrizeIndex(currentRotation);
      const prize = PRIZES[winIndex];
      showResult(prize);
    }
  }

  requestAnimationFrame(animateWheel);
}

// ===== 结果弹窗 =====
function showResult(prize) {
  modalEmoji.textContent = prize.emoji;
  modalPrize.textContent = prize.name;
  modalOverlay.classList.add('show');

  // 记录历史
  history.push(prize);
  updateHistory();

  // 放纸屑 (除了"谢谢参与")
  if (prize.name !== '谢谢参与') {
    launchConfetti();
  }

  // 检查次数
  if (remainingSpins <= 0) {
    spinBtn.textContent = '🎉 已用完啦';
    spinBtn.disabled = true;
  }
}

function closeModal() {
  modalOverlay.classList.remove('show');
}

// ===== 纸屑效果 =====
let confettiPieces = [];
let confettiAnimId = null;

function launchConfetti() {
  const c = confettiCanvas;
  const w = c.width = window.innerWidth;
  const h = c.height = window.innerHeight;
  const cctx = c.getContext('2d');

  const colors = ['#FF6B9D', '#FF9F43', '#FECA57', '#48DBFB', '#A29BFE', '#fd79a8', '#00cec9', '#fdcb6e'];

  confettiPieces = [];
  for (let i = 0; i < 120; i++) {
    confettiPieces.push({
      x: w / 2 + (Math.random() - 0.5) * 100,
      y: h / 2,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 14 - 4,
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      gravity: 0.3 + Math.random() * 0.2,
      opacity: 1,
    });
  }

  if (confettiAnimId) cancelAnimationFrame(confettiAnimId);

  function drawConfetti() {
    cctx.clearRect(0, 0, w, h);
    let alive = false;

    for (const p of confettiPieces) {
      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.rot += p.rotSpeed;
      p.opacity -= 0.004;

      if (p.opacity <= 0 || p.y > h + 20) continue;
      alive = true;

      cctx.save();
      cctx.translate(p.x, p.y);
      cctx.rotate((p.rot * Math.PI) / 180);
      cctx.globalAlpha = Math.max(0, p.opacity);
      cctx.fillStyle = p.color;
      cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cctx.restore();
    }

    if (alive) {
      confettiAnimId = requestAnimationFrame(drawConfetti);
    } else {
      cctx.clearRect(0, 0, w, h);
    }
  }

  drawConfetti();
}

// ===== 历史记录 =====
function updateHistory() {
  historyDiv.innerHTML = '<div class="history-label">📋 抽奖记录</div>';
  history.slice().reverse().forEach(p => {
    const item = document.createElement('span');
    item.className = 'history-item';
    item.textContent = `${p.emoji} ${p.name}`;
    historyDiv.appendChild(item);
  });
}

// ===== 窗口自适应 =====
window.addEventListener('resize', () => {
  // confetti canvas 自适应
});

// ===== 事件绑定 =====
spinBtn.addEventListener('click', spin);
modalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
// 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
  if (e.key === ' ' || e.key === 'Enter') {
    if (modalOverlay.classList.contains('show')) {
      closeModal();
    } else {
      spin();
    }
  }
});

// ===== 初始化 =====
drawWheel(0);
updateHistory();
remainSpan.textContent = remainingSpins;
