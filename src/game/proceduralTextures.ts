import * as THREE from 'three';

/**
 * Procedural Canvas Textures for NEON DRIVE
 * Enforces SRGBColorSpace and high anisotropy for grazing angles.
 */

export function createRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base wet dark asphalt
  ctx.fillStyle = '#0f131a';
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle tarmac noise
  const imgData = ctx.getImageData(0, 0, 512, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain * 1.1));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain * 1.3));
  }
  ctx.putImageData(imgData, 0, 0);

  // Road edges (solid bright lines with wet glow)
  ctx.fillStyle = '#4fa3ff';
  ctx.fillRect(16, 0, 6, 1024);
  ctx.fillRect(490, 0, 6, 1024);

  // Yellow double median line
  ctx.fillStyle = '#ffaa00';
  ctx.fillRect(250, 0, 4, 1024);
  ctx.fillRect(258, 0, 4, 1024);

  // White lane dashes
  ctx.fillStyle = '#e2e8f0';
  const dashLength = 60;
  const gapLength = 60;
  for (let y = 0; y < 1024; y += dashLength + gapLength) {
    ctx.fillRect(134, y, 4, dashLength);
    ctx.fillRect(374, y, 4, dashLength);
  }

  // Wet reflections / tire track sheens
  ctx.fillStyle = 'rgba(0, 240, 255, 0.04)';
  ctx.fillRect(80, 0, 100, 1024);
  ctx.fillRect(320, 0, 100, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createIntersectionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0e1219';
  ctx.fillRect(0, 0, 512, 512);

  // Crosswalk zebra stripes on all 4 borders
  ctx.fillStyle = '#cbd5e1';
  const stripeWidth = 14;
  const stripeGap = 14;
  
  // North & South crosswalks
  for (let x = 60; x < 452; x += stripeWidth + stripeGap) {
    ctx.fillRect(x, 24, stripeWidth, 36);
    ctx.fillRect(x, 452, stripeWidth, 36);
  }
  // East & West crosswalks
  for (let y = 60; y < 452; y += stripeWidth + stripeGap) {
    ctx.fillRect(24, y, 36, stripeWidth);
    ctx.fillRect(452, y, 36, stripeWidth);
  }

  // Center subtle cyber compass / intersection diamond
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(180, 180, 152, 152);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSkyscraperTexture(themeColor: string = '#00f0ff'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#080a10';
  ctx.fillRect(0, 0, 256, 512);

  const rows = 32;
  const cols = 12;
  const winW = 12;
  const winH = 8;
  const padX = 8;
  const padY = 7;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.45;
      if (isLit) {
        const rand = Math.random();
        if (rand < 0.5) {
          ctx.fillStyle = themeColor;
        } else if (rand < 0.75) {
          ctx.fillStyle = '#ffffff';
        } else if (rand < 0.9) {
          ctx.fillStyle = '#ff007f';
        } else {
          ctx.fillStyle = '#ffbb00';
        }
        ctx.fillRect(16 + c * (winW + padX), 16 + r * (winH + padY), winW, winH);
      }
    }
  }

  // Vertical neon accent strips
  ctx.fillStyle = themeColor;
  ctx.fillRect(2, 0, 4, 512);
  ctx.fillRect(250, 0, 4, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createNeonBillboardTexture(text: string, subtext: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark cyber background
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, 512, 256);

  // Cyber grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 512; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Neon glowing outer frame
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 236);

  // Main text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 54px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.fillText(text, 256, 110);

  // Subtext
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = color;
  ctx.shadowBlur = 12;
  ctx.fillText(subtext, 256, 175);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, 64, 64);

  ctx.fillStyle = '#1c2028';
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      if ((x / 8 + y / 8) % 2 === 0) {
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createTireTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#151515';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#0a0a0a';
  for (let x = 0; x < 128; x += 16) {
    ctx.fillRect(x, 0, 8, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
