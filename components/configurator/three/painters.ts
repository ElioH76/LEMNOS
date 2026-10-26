import { ARMPIT_V } from "./constants";
import type { DesignConfig, PatternId } from "@/lib/configurator/types";

/**
 * Peinture des textures du maillot sur <canvas> 2D (couleurs, motifs,
 * panneaux, liserés). Les logos et le flocage ne sont PAS peints ici : ce sont
 * des décalcomanies projetées sur le maillage (netteté indépendante de la
 * résolution de ces textures).
 *
 * Repère du corps : x = u·W (milieu devant à W/4, milieu dos à 3W/4, flancs à
 * 0 et W/2), y = (1 − v)·H. Échelle ≈ PX_PER_M pixels par mètre, à 2048 px.
 */
const PX_PER_M_AT_2048 = 1500;

type Ctx = CanvasRenderingContext2D;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Assombrit (amount < 0) ou éclaircit (amount > 0) une couleur. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Couleur ton sur ton : légèrement plus sombre, ou plus claire sur un fond très sombre. */
function tonal(hex: string): string {
  return luminance(hex) < 0.18 ? shade(hex, 0.12) : shade(hex, -0.14);
}

/**
 * Dessine un motif sur la zone [x0, x0 + w] × [0, h], symétrique autour de `cx`
 * (milieu de la face). `ppm` = pixels par mètre.
 */
function drawPattern(ctx: Ctx, id: PatternId, x0: number, w: number, h: number, cx: number, ppm: number, scale: number, body: string, secondary: string) {
  if (id === "plain") return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, 0, w, h);
  ctx.clip();
  const unit = ppm * scale;

  switch (id) {
    case "stripes-vertical": {
      const period = 0.09 * unit;
      const band = period * 0.5;
      ctx.fillStyle = secondary;
      for (let k = -Math.ceil(w / period) - 1; k <= Math.ceil(w / period) + 1; k++) {
        ctx.fillRect(cx + k * period - band / 2, 0, band, h);
      }
      break;
    }
    case "stripes-horizontal": {
      const period = 0.1 * unit;
      ctx.fillStyle = secondary;
      for (let y = h; y > -period; y -= period) ctx.fillRect(x0, y - period * 0.5, w, period * 0.5);
      break;
    }
    case "diagonal": {
      const band = 0.075 * unit;
      const gap = 0.11 * unit;
      ctx.fillStyle = secondary;
      ctx.translate(cx, h * 0.45);
      ctx.rotate(-Math.PI / 5);
      for (let k = -1; k <= 1; k++) ctx.fillRect(-w * 2, k * (band + gap) - band / 2, w * 4, band);
      break;
    }
    case "gradient": {
      const g = ctx.createLinearGradient(0, h * 0.12, 0, h);
      g.addColorStop(0, body);
      g.addColorStop(1, secondary);
      ctx.fillStyle = g;
      ctx.fillRect(x0, 0, w, h);
      break;
    }
    case "chevrons": {
      const period = 0.13 * unit;
      const thick = 0.045 * unit;
      ctx.strokeStyle = secondary;
      ctx.lineWidth = thick;
      ctx.lineJoin = "miter";
      for (let y = -period; y < h + period * 2; y += period) {
        ctx.beginPath();
        ctx.moveTo(cx - w, y - w * 0.45);
        ctx.lineTo(cx, y);
        ctx.lineTo(cx + w, y - w * 0.45);
        ctx.stroke();
      }
      break;
    }
    case "waves": {
      ctx.strokeStyle = secondary;
      ctx.lineCap = "round";
      const amp = 0.05 * unit;
      const len = 0.42 * unit;
      for (let i = 0; i < 7; i++) {
        const y0 = h * (0.12 + i * 0.13);
        ctx.lineWidth = (0.012 + (i % 3) * 0.012) * unit;
        ctx.globalAlpha = 0.55 + (i % 2) * 0.35;
        ctx.beginPath();
        for (let x = x0 - 20; x <= x0 + w + 20; x += 8) {
          const t = (x - cx) / len;
          const y = y0 + Math.sin(t * Math.PI * 2 + i * 1.3) * amp + Math.sin(t * 5.1 + i) * amp * 0.35;
          if (x === x0 - 20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case "tonal": {
      const period = 0.035 * unit;
      ctx.fillStyle = tonal(body);
      for (let k = -Math.ceil(w / period) - 1; k <= Math.ceil(w / period) + 1; k++) {
        ctx.fillRect(cx + k * period - period * 0.25, 0, period * 0.5, h);
      }
      break;
    }
    case "hex-tech": {
      // Trame de points dont la taille croît vers le bas : effet « technique ».
      const step = 0.022 * unit;
      ctx.fillStyle = secondary;
      for (let row = 0, y = 0; y < h + step; row++, y += step * 0.866) {
        const t = Math.min(1, Math.max(0, (y / h - 0.25) / 0.75));
        const r = step * 0.48 * t;
        if (r < 0.6) continue;
        const shift = row % 2 ? step / 2 : 0;
        for (let x = cx - Math.ceil(w / step) * step + shift; x < x0 + w + step; x += step) {
          if (x < x0 - step) continue;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
  }
  ctx.restore();
}

/** Ligne de surpiqûre discrète. */
function stitch(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, ppm: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = Math.max(1, ppm * 0.0012);
  ctx.setLineDash([ppm * 0.004, ppm * 0.003]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function paintBody(canvas: HTMLCanvasElement, design: DesignConfig) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  const ppm = (PX_PER_M_AT_2048 * W) / 2048;
  const { colors, pattern, finish } = design;

  ctx.fillStyle = colors.body;
  ctx.fillRect(0, 0, W, H);

  // Motif : chaque face est dessinée séparément, symétrique autour de son milieu.
  drawPattern(ctx, pattern.id, 0, W / 2, H, W / 4, ppm, pattern.scale, colors.body, colors.secondary);
  drawPattern(ctx, pattern.id, W / 2, W / 2, H, (3 * W) / 4, ppm, pattern.scale, colors.body, colors.secondary);

  const armpitY = (1 - ARMPIT_V) * H;
  if (finish.sidePanels) {
    const half = 0.032 * ppm;
    ctx.fillStyle = colors.sidePanels;
    for (const x of [0, W / 2, W]) {
      ctx.beginPath();
      ctx.moveTo(x - half, H);
      ctx.lineTo(x - half, armpitY + half);
      ctx.quadraticCurveTo(x, armpitY - half * 0.6, x + half, armpitY + half);
      ctx.lineTo(x + half, H);
      ctx.closePath();
      ctx.fill();
      stitch(ctx, x - half, H, x - half, armpitY + half, ppm);
      stitch(ctx, x + half, H, x + half, armpitY + half, ppm);
    }
  }

  const hemH = 0.024 * ppm;
  if (finish.hemTrim) {
    ctx.fillStyle = colors.trim;
    ctx.fillRect(0, H - hemH, W, hemH);
  }
  stitch(ctx, 0, H - hemH, W, H - hemH, ppm);
}

export function paintSleeve(canvas: HTMLCanvasElement, design: DesignConfig) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  // Une manche fait ~0.55 m de tour et ~0.35 m de long.
  const ppm = W / 0.55;
  const { colors, pattern, finish } = design;

  ctx.fillStyle = colors.sleeves;
  ctx.fillRect(0, 0, W, H);
  if (finish.patternOnSleeves) {
    drawPattern(ctx, pattern.id, 0, W, H, W * 0.25, ppm, pattern.scale, colors.sleeves, colors.secondary);
  }
  const cuffH = H * 0.085;
  if (finish.cuffTrim) {
    ctx.fillStyle = colors.trim;
    ctx.fillRect(0, 0, W, cuffH);
  }
  stitch(ctx, 0, cuffH, W, cuffH, ppm);
}

/** Vignette de motif pour l'interface (même code que le rendu 3D). */
export function paintPatternSwatch(canvas: HTMLCanvasElement, id: PatternId, body: string, secondary: string) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width;
  const H = canvas.height;
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, W, H);
  drawPattern(ctx, id, 0, W, H, W / 2, W / 0.36, 1, body, secondary);
}

/**
 * Carte de normales procédurale : maille piquée de maillot technique
 * (alvéoles décalées). Tuile répétée sur tout le vêtement.
 */
export function makeKnitNormalCanvas(size = 128): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cells = 16;
  const cell = size / cells;
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = Math.floor(y / cell);
      const ox = (row % 2) * cell * 0.5;
      const lx = (((x + ox) % cell) + cell) % cell - cell / 2;
      const ly = (y % cell) - cell / 2;
      const d = Math.sqrt(lx * lx + ly * ly) / (cell / 2);
      height[y * size + x] = Math.min(1, Math.max(0, (d - 0.35) / 0.4));
    }
  }
  const img = ctx.createImageData(size, size);
  const h = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = h(x + 1, y) - h(x - 1, y);
      const dy = h(x, y + 1) - h(x, y - 1);
      const nx = -dx;
      const ny = dy;
      const nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const i = (y * size + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}
