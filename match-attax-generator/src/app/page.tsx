"use client";

import type { ChangeEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bungee } from "next/font/google";

type Stat = {
  label: string;
  value: number;
};

const DEFAULT_STATS: Stat[] = [
  { label: "Speed", value: 88 },
  { label: "Tackle", value: 91 },
  { label: "Power", value: 92 },
  { label: "Skill", value: 87 },
  { label: "Pass", value: 90 },
  { label: "Shoot", value: 94 },
];

const clampStat = (value: number) => {
  if (Number.isNaN(value)) return 0;
  return Math.min(110, Math.max(0, Math.round(value)));
};

const CARD_WIDTH = 320;
const CARD_HEIGHT = 460;
const FOOTER_HEIGHT = 80;
const NAME_BAR_WIDTH = 48;
const STAT_ROW_HEIGHT = 34;
const STAT_GAP = 0;
const LEFT_STAT_WIDTHS = [96, 112, 128];
const RIGHT_STAT_WIDTHS = [96, 112, 128];

const bungee = Bungee({
  weight: "400",
  subsets: ["latin"],
});

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

type RoundedCorners = {
  topLeft?: number;
  topRight?: number;
  bottomRight?: number;
  bottomLeft?: number;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  corners: RoundedCorners,
) => {
  const {
    topLeft = 0,
    topRight = 0,
    bottomRight = 0,
    bottomLeft = 0,
  } = corners;

  ctx.beginPath();
  ctx.moveTo(x + topLeft, y);
  ctx.lineTo(x + width - topRight, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
  ctx.lineTo(x + width, y + height - bottomRight);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - bottomRight,
    y + height,
  );
  ctx.lineTo(x + bottomLeft, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
  ctx.lineTo(x, y + topLeft);
  ctx.quadraticCurveTo(x, y, x + topLeft, y);
  ctx.closePath();
};

type DrawCardData = {
  uppercaseName: string;
  position: string;
  attack: number;
  defence: number;
  stats: Stat[];
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
};

type DrawCardParams = {
  canvas: HTMLCanvasElement;
  scale?: number;
  playerImage?: HTMLImageElement | null;
  logoImage?: HTMLImageElement | null;
  data: DrawCardData;
};

const drawCard = async ({
  canvas,
  scale = 1,
  playerImage,
  logoImage,
  data,
}: DrawCardParams) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const normalizedScale = Math.max(scale, 1);

  canvas.width = CARD_WIDTH * normalizedScale;
  canvas.height = CARD_HEIGHT * normalizedScale;

  if (!canvas.style.width) {
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
  }

  ctx.setTransform(normalizedScale, 0, 0, normalizedScale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  if (typeof document !== "undefined" && "fonts" in document) {
    await document.fonts.ready;
  }

  const fontFamily = data.fontFamily || "Bungee";

  // base background
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const backgroundGradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  backgroundGradient.addColorStop(
    0,
    hexToRgba(data.primaryColor, playerImage ? 0.65 : 0.9),
  );
  backgroundGradient.addColorStop(
    1,
    hexToRgba(data.secondaryColor, playerImage ? 0.85 : 0.95),
  );
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  if (playerImage && playerImage.width && playerImage.height) {
    const ratio = playerImage.width / playerImage.height;
    const targetRatio = CARD_WIDTH / CARD_HEIGHT;
    let drawWidth = CARD_WIDTH;
    let drawHeight = CARD_HEIGHT;
    let offsetX = 0;
    let offsetY = 0;

    if (ratio > targetRatio) {
      drawHeight = CARD_HEIGHT;
      drawWidth = drawHeight * ratio;
      offsetX = (CARD_WIDTH - drawWidth) / 2;
    } else {
      drawWidth = CARD_WIDTH;
      drawHeight = drawWidth / ratio;
      offsetY = (CARD_HEIGHT - drawHeight) / 2;
    }

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(playerImage, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();
  } else {
    const fallbackGradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
    fallbackGradient.addColorStop(0, "#475569");
    fallbackGradient.addColorStop(1, "#1f2937");
    ctx.fillStyle = fallbackGradient;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  const topHalo = ctx.createRadialGradient(60, 60, 0, 60, 60, 200);
  topHalo.addColorStop(0, hexToRgba(data.primaryColor, 0.35));
  topHalo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topHalo;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const bottomHalo = ctx.createRadialGradient(
    CARD_WIDTH - 60,
    CARD_HEIGHT - 40,
    0,
    CARD_WIDTH - 60,
    CARD_HEIGHT - 40,
    220,
  );
  bottomHalo.addColorStop(0, hexToRgba(data.secondaryColor, 0.35));
  bottomHalo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bottomHalo;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const vignette = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  vignette.addColorStop(0, "rgba(0,0,0,0.15)");
  vignette.addColorStop(0.55, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Removed outer card border stroke

  const normalizedStats = data.stats.map((stat) => ({
    label: (stat.label || "STAT").toUpperCase(),
    value: clampStat(stat.value),
  }));
  const leftStats = normalizedStats.slice(0, 3);
  const rightStats = normalizedStats.slice(3, 6);

  const totalStatsHeight =
    leftStats.length * STAT_ROW_HEIGHT + (leftStats.length - 1) * STAT_GAP;
  const statsStartY = CARD_HEIGHT - FOOTER_HEIGHT - totalStatsHeight - 6;
  const statsAreaWidth = CARD_WIDTH - NAME_BAR_WIDTH;
  const leftColumnX = 8;
  const rightColumnEdge = NAME_BAR_WIDTH + statsAreaWidth - 8;

  const nameLettersCount = data.uppercaseName.length;
  const nameBarHeight = Math.max(110, nameLettersCount * 22 + 28);
  ctx.save();
  drawRoundedRect(ctx, 0, 0, NAME_BAR_WIDTH, nameBarHeight, {
    topLeft: 0,
    topRight: 0,
    bottomRight: 28,
    bottomLeft: 0,
  });
  const nameGradient = ctx.createLinearGradient(0, 0, NAME_BAR_WIDTH, nameBarHeight);
  nameGradient.addColorStop(0, hexToRgba(data.primaryColor, 0.85));
  nameGradient.addColorStop(1, hexToRgba("#0f172a", 0.85));
  ctx.fillStyle = nameGradient;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(NAME_BAR_WIDTH / 2, nameBarHeight / 2);
  // ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  const letters = data.uppercaseName.split("");
  const letterSpacing = 22;
  ctx.font = `700 18px ${fontFamily}`;
  let verticalOffset = -((letters.length - 1) * letterSpacing) / 2;
  letters.forEach((letter) => {
    ctx.fillText(letter, 0, verticalOffset);
    verticalOffset += letterSpacing;
  });
  ctx.restore();

  const logoMaxSize = 60;
  if (logoImage && logoImage.width && logoImage.height) {
    const ratio = logoImage.width / logoImage.height;
    let drawWidth: number;
    let drawHeight: number;
    if (ratio > 1) {
      drawWidth = logoMaxSize;
      drawHeight = logoMaxSize / ratio;
    } else {
      drawHeight = logoMaxSize;
      drawWidth = logoMaxSize * ratio;
    }
    const logoX = CARD_WIDTH - drawWidth - 12;
    const logoY = 12;
    ctx.drawImage(logoImage, logoX, logoY, drawWidth, drawHeight);
  }

  const drawStatRow = (
    x: number,
    y: number,
    width: number,
    value: number,
    label: string,
    align: "left" | "right",
  ) => {
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    if (align === "left") {
      gradient.addColorStop(0, "rgba(15,23,42,0.9)");
      gradient.addColorStop(1, "rgba(51,65,85,0.75)");
    } else {
      gradient.addColorStop(0, "rgba(51,65,85,0.75)");
      gradient.addColorStop(1, "rgba(15,23,42,0.9)");
    }
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, x, y, width, STAT_ROW_HEIGHT, {
      topLeft: 6,
      topRight: 6,
      bottomRight: 6,
      bottomLeft: 6,
    });
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x, y + STAT_ROW_HEIGHT - 1, width, 1);

    ctx.fillStyle =
      align === "left" ? "rgba(163,230,53,0.75)" : "rgba(251,191,36,0.75)";
    if (align === "left") {
      ctx.fillRect(x, y, 4, STAT_ROW_HEIGHT);
    } else {
      ctx.fillRect(x + width - 4, y, 4, STAT_ROW_HEIGHT);
    }

    const centerY = y + STAT_ROW_HEIGHT / 2;
    const valueText = String(value);
    // Value on the column side
    ctx.fillStyle = align === "left" ? "#d9f99d" : "#fed7aa";
    ctx.font = `700 20px ${fontFamily}`;
    ctx.textBaseline = "middle";
    if (align === "left") {
      // Justify-start: value then label to its right
      ctx.textAlign = "left";
      const valueX = x + 14;
      ctx.fillText(valueText, valueX, centerY);
      const valueWidth = ctx.measureText(valueText).width;
      ctx.font = `600 10px ${fontFamily}`;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "left";
      const labelX = valueX + valueWidth + 8;
      ctx.fillText(label, labelX, centerY);
    } else {
      // Justify-end: label then value at far right
      ctx.textAlign = "right";
      const valueX = x + width - 14;
      // Draw value at the far right
      ctx.fillText(valueText, valueX, centerY);
      const valueWidth = ctx.measureText(valueText).width;
      // Draw label just to the left of the value
      ctx.font = `600 10px ${fontFamily}`;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "right";
      const labelX = valueX - valueWidth - 8;
      ctx.fillText(label, labelX, centerY);
    }
  };

  let currentY = statsStartY;
  leftStats.forEach((stat, index) => {
    const width =
      LEFT_STAT_WIDTHS[index] ?? LEFT_STAT_WIDTHS[LEFT_STAT_WIDTHS.length - 1];
    drawStatRow(leftColumnX, currentY, width, stat.value, stat.label, "left");
    currentY += STAT_ROW_HEIGHT + STAT_GAP;
  });

  currentY = statsStartY;
  rightStats.forEach((stat, index) => {
    const width =
      RIGHT_STAT_WIDTHS[index] ?? RIGHT_STAT_WIDTHS[RIGHT_STAT_WIDTHS.length - 1];
    const x = rightColumnEdge - width;
    drawStatRow(x, currentY, width, stat.value, stat.label, "right");
    currentY += STAT_ROW_HEIGHT + STAT_GAP;
  });

  const footerY = CARD_HEIGHT - FOOTER_HEIGHT;
  ctx.save();
  drawRoundedRect(ctx, 0, footerY, CARD_WIDTH, FOOTER_HEIGHT, {
    topLeft: 24,
    topRight: 24,
    bottomLeft: 0,
    bottomRight: 0,
  });
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill();
  ctx.restore();

  const positionWidth = 96;
  const sideWidth = (CARD_WIDTH - positionWidth) / 2;

  ctx.save();
  drawRoundedRect(ctx, 0, footerY, sideWidth, FOOTER_HEIGHT, {
    topLeft: 20,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0,
  });
  const defenceGradient = ctx.createLinearGradient(
    0,
    footerY,
    0,
    footerY + FOOTER_HEIGHT,
  );
  defenceGradient.addColorStop(0, hexToRgba(data.primaryColor, 0.95));
  defenceGradient.addColorStop(1, hexToRgba(data.primaryColor, 0.65));
  ctx.fillStyle = defenceGradient;
  ctx.fill();
  ctx.restore();

  ctx.save();
  const attackX = sideWidth + positionWidth;
  drawRoundedRect(ctx, attackX, footerY, sideWidth, FOOTER_HEIGHT, {
    topLeft: 0,
    topRight: 20,
    bottomLeft: 0,
    bottomRight: 0,
  });
  const attackGradient = ctx.createLinearGradient(
    0,
    footerY,
    0,
    footerY + FOOTER_HEIGHT,
  );
  attackGradient.addColorStop(0, hexToRgba(data.secondaryColor, 0.95));
  attackGradient.addColorStop(1, hexToRgba(data.secondaryColor, 0.65));
  ctx.fillStyle = attackGradient;
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "rgba(241,245,249,0.9)";
  ctx.fillRect(sideWidth, footerY, positionWidth, FOOTER_HEIGHT);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(sideWidth, footerY, 1, FOOTER_HEIGHT);
  ctx.fillRect(sideWidth + positionWidth - 1, footerY, 1, FOOTER_HEIGHT);

  const defenceValue = clampStat(data.defence);
  const attackValue = clampStat(data.attack);

  ctx.font = `700 48px ${fontFamily}`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(defenceValue), 20, footerY + 48);

  ctx.font = `600 11px ${fontFamily}`;
  ctx.fillStyle = "rgba(226,232,240,0.9)";
  ctx.fillText("DEFENCE", 20, footerY + FOOTER_HEIGHT - 14);

  ctx.textAlign = "right";
  ctx.font = `700 48px ${fontFamily}`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(attackValue), CARD_WIDTH - 20, footerY + 48);

  ctx.font = `600 11px ${fontFamily}`;
  ctx.fillStyle = "rgba(254,226,226,0.9)";
  ctx.fillText("ATTACK", CARD_WIDTH - 20, footerY + FOOTER_HEIGHT - 14);

  const positionLabel = (data.position || "POSITION").toUpperCase();
  let positionFontSize = 13;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let measuredWidth = Infinity;
  while (positionFontSize >= 9 && measuredWidth > positionWidth - 16) {
    ctx.font = `700 ${positionFontSize}px ${fontFamily}`;
    measuredWidth = ctx.measureText(positionLabel).width;
    if (measuredWidth > positionWidth - 16) positionFontSize -= 1;
  }
  ctx.font = `700 ${positionFontSize}px ${fontFamily}`;
  ctx.fillStyle = "#0f172a";
  ctx.fillText(positionLabel, CARD_WIDTH / 2, footerY + FOOTER_HEIGHT / 2);
};

export default function Home() {
  const [playerName, setPlayerName] = useState("Star Striker");
  const [position, setPosition] = useState("Defender");
  const [attack, setAttack] = useState(97);
  const [defence, setDefence] = useState(89);
  const [stats, setStats] = useState<Stat[]>(() =>
    DEFAULT_STATS.map((stat) => ({ ...stat })),
  );
  const [playerImage, setPlayerImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#1d4ed8");
  const [secondaryColor, setSecondaryColor] = useState("#f97316");
  const [isDownloading, setIsDownloading] = useState(false);

  const [playerImageElement, setPlayerImageElement] =
    useState<HTMLImageElement | null>(null);
  const [logoImageElement, setLogoImageElement] =
    useState<HTMLImageElement | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const uppercaseName = useMemo(
    () => (playerName || "Star Striker").toUpperCase(),
    [playerName],
  );

  useEffect(() => {
    if (!playerImage) {
      setPlayerImageElement(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) setPlayerImageElement(img);
    };
    img.onerror = () => {
      if (!cancelled) setPlayerImageElement(null);
    };
    img.src = playerImage;
    return () => {
      cancelled = true;
    };
  }, [playerImage]);

  useEffect(() => {
    if (!logoImage) {
      setLogoImageElement(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!cancelled) setLogoImageElement(img);
    };
    img.onerror = () => {
      if (!cancelled) setLogoImageElement(null);
    };
    img.src = logoImage;
    return () => {
      cancelled = true;
    };
  }, [logoImage]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const deviceScale =
      typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    drawCard({
      canvas,
      scale: deviceScale,
      playerImage: playerImageElement,
      logoImage: logoImageElement,
      data: {
        uppercaseName,
        position,
        attack,
        defence,
        stats,
        primaryColor,
        secondaryColor,
        fontFamily: bungee.style.fontFamily,
      },
    }).catch((error) => console.error("Failed to render preview", error));
  }, [
    uppercaseName,
    position,
    attack,
    defence,
    stats,
    primaryColor,
    secondaryColor,
    playerImageElement,
    logoImageElement,
  ]);

  const handleStatLabelChange = (index: number, label: string) => {
    setStats((prev) =>
      prev.map((stat, statIndex) =>
        statIndex === index ? { ...stat, label } : stat,
      ),
    );
  };

  const handleStatValueChange = (index: number, value: string) => {
    const numeric = clampStat(Number(value));
    setStats((prev) =>
      prev.map((stat, statIndex) =>
        statIndex === index ? { ...stat, value: numeric } : stat,
      ),
    );
  };

  const handleImageUpload = (
    event: ChangeEvent<HTMLInputElement>,
    setter: (value: string | null) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setter(typeof e.target?.result === "string" ? e.target.result : null);
    };
    reader.readAsDataURL(file);
  };

  const resetImages = (setter: (value: string | null) => void) => {
    setter(null);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const wrapperCanvas = document.createElement("canvas");
      const wrapperWidth = 1080;
      const wrapperHeight = 1350;
      wrapperCanvas.width = wrapperWidth;
      wrapperCanvas.height = wrapperHeight;

      const resolvedPlayerImage =
        playerImageElement ?? (playerImage ? await loadImage(playerImage) : null);
      const resolvedLogoImage =
        logoImageElement ?? (logoImage ? await loadImage(logoImage) : null);

      // Render the card to CONTAIN within the 1080x1350 frame (preserve full height)
      const cardCanvas = document.createElement("canvas");
      const scaleToCover = Math.min(
        wrapperWidth / CARD_WIDTH,
        wrapperHeight / CARD_HEIGHT,
      );
      await drawCard({
        canvas: cardCanvas,
        scale: scaleToCover,
        playerImage: resolvedPlayerImage,
        logoImage: resolvedLogoImage,
        data: {
          uppercaseName,
          position,
          attack,
          defence,
          stats,
          primaryColor,
          secondaryColor,
          fontFamily: bungee.style.fontFamily,
        },
      });

      const wctx = wrapperCanvas.getContext("2d");
      if (!wctx) throw new Error("Failed to get 2D context for export");

      // Background fill/gradient to 4:5 frame
      wctx.fillStyle = "#020617";
      wctx.fillRect(0, 0, wrapperWidth, wrapperHeight);
      const backgroundGradient = wctx.createLinearGradient(0, 0, wrapperWidth, wrapperHeight);
      backgroundGradient.addColorStop(0, hexToRgba(primaryColor, resolvedPlayerImage ? 0.65 : 0.9));
      backgroundGradient.addColorStop(1, hexToRgba(secondaryColor, resolvedPlayerImage ? 0.85 : 0.95));
      wctx.fillStyle = backgroundGradient;
      wctx.fillRect(0, 0, wrapperWidth, wrapperHeight);

      // Center the contained card; equal offsets keep it aligned within the frame
      const offsetX = Math.round((wrapperWidth - cardCanvas.width) / 2);
      const offsetY = Math.round((wrapperHeight - cardCanvas.height) / 2);
      wctx.drawImage(cardCanvas, offsetX, offsetY);

      const dataUrl = wrapperCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${playerName || "match-attax-card"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export canvas", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 md:flex-row md:py-16">
        <section className="md:w-1/2">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Match Attax Generator
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-300 md:text-base">
            Match the classic Match Attax aesthetic with a vertical name bar, full
            background artwork, staggered stat plates and a bold footer panel. Use
            the controls to tailor every element, then export a crisp PNG for
            sharing or printing.
          </p>

          <div className="mt-8 space-y-8">
            <div className="grid gap-6 rounded-2xl border border-white/5 bg-white/5 p-6 shadow-lg backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Player name
                  <input
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-base font-medium text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value.slice(0, 18))}
                    placeholder="Name on card"
                    maxLength={18}
                  />
                </label>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Position label
                  <input
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-base font-medium text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                    value={position}
                    onChange={(event) => setPosition(event.target.value.slice(0, 16))}
                    placeholder="e.g. Defender"
                    maxLength={16}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Attack rating
                  <input
                    type="number"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-base font-semibold text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                    value={attack}
                    onChange={(event) =>
                      setAttack(clampStat(Number(event.target.value)))
                    }
                    min={0}
                    max={110}
                  />
                </label>
                <label className="text-xs font-semibold uppercase text-slate-300">
                  Defence rating
                  <input
                    type="number"
                    inputMode="numeric"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-base font-semibold text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                    value={defence}
                    onChange={(event) =>
                      setDefence(clampStat(Number(event.target.value)))
                    }
                    min={0}
                    max={110}
                  />
                </label>
              </div>

              <div className="grid gap-3">
                <h2 className="text-xs font-semibold uppercase text-slate-300">
                  Player stats
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {stats.map((stat, index) => (
                    <div key={index} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                      <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Label
                        <input
                          className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-2 py-2 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                          value={stat.label}
                          onChange={(event) =>
                            handleStatLabelChange(index, event.target.value.slice(0, 12))
                          }
                          maxLength={12}
                          placeholder="e.g. Pace"
                        />
                      </label>
                      <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Value
                        <input
                          type="number"
                          inputMode="numeric"
                          className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-2 py-2 text-sm font-semibold text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
                          value={stat.value}
                          onChange={(event) =>
                            handleStatValueChange(index, event.target.value)
                          }
                          min={0}
                          max={110}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-white/5 bg-white/5 p-6 shadow-lg backdrop-blur">
              <h2 className="text-xs font-semibold uppercase text-slate-300">
                Imagery
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Player background image
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 block w-full cursor-pointer text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-400"
                      onChange={(event) => handleImageUpload(event, setPlayerImage)}
                    />
                  </label>
                  {playerImage ? (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
                      <span>Artwork loaded</span>
                      <button
                        type="button"
                        className="rounded-md bg-rose-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-rose-400"
                        onClick={() => resetImages(setPlayerImage)}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">
                      Use a tall portrait shot. The card adds a soft glow around the
                      edges to mimic the Match Attax halo.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Club or logo image
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 block w-full cursor-pointer text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-400"
                      onChange={(event) => handleImageUpload(event, setLogoImage)}
                    />
                  </label>
                  {logoImage ? (
                    <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-slate-300">
                      <span>Logo loaded</span>
                      <button
                        type="button"
                        className="rounded-md bg-rose-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-rose-400"
                        onClick={() => resetImages(setLogoImage)}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">
                      Transparent PNG crests sit cleanly over the corner plate.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-white/5 bg-white/5 p-6 shadow-lg backdrop-blur">
              <h2 className="text-xs font-semibold uppercase text-slate-300">
                Colour palette
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Primary glow
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    className="mt-2 h-12 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                </label>
                <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Secondary glow
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(event) => setSecondaryColor(event.target.value)}
                    className="mt-2 h-12 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setPlayerName("Star Striker");
                  setPosition("Defender");
                  setAttack(97);
                  setDefence(89);
                  setStats(DEFAULT_STATS.map((stat) => ({ ...stat })));
                  setPlayerImage(null);
                  setLogoImage(null);
                  setPrimaryColor("#1d4ed8");
                  setSecondaryColor("#f97316");
                }}
                className="rounded-xl border border-white/10 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-white"
              >
                Reset to defaults
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400 disabled:cursor-wait disabled:bg-indigo-400/70"
              >
                {isDownloading ? "Preparing..." : "Download card"}
              </button>
            </div>
          </div>
        </section>

        <section className="md:flex-1">
          <div className="sticky top-16 flex justify-center">
            <div className={`${bungee.className} relative`}>
              <canvas
                ref={previewCanvasRef}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className="h-[460px] w-[320px] overflow-hidden rounded-[24px] bg-transparent shadow-[0_30px_90px_-25px_rgba(30,64,175,0.7)]"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
