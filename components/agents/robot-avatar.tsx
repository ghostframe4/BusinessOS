import type * as React from "react";

import { agentSeed } from "@/lib/agents/persona";
import { cn } from "@/lib/utils";

/**
 * Avatar de robozinho gerado proceduralmente a partir do slug do agente.
 * Determinístico: mesmo slug -> mesmo robô. As variações (paleta, antena,
 * olhos, boca) vêm de canais independentes do hash, então cada agente tem um
 * rosto único. Desenhado em SVG inline (viewBox 64x64), tema-agnóstico — é uma
 * "ilha" de cor que funciona sobre card claro ou escuro.
 */

interface Palette {
  /** Fundo do círculo. */
  bg: string;
  /** Corpo/cabeça do robô + olhos + boca (cor de contraste). */
  body: string;
  /** Detalhe: antena e orelhas. */
  accent: string;
  /** Painel do rosto (tela clara onde ficam os olhos). */
  face: string;
}

// Paletas suaves e coesas (uma matiz por robô) — pop de cor sem quebrar o P&B.
const PALETTES: Palette[] = [
  { bg: "#E5E9FF", body: "#4453C4", accent: "#8A94E8", face: "#F4F6FF" }, // indigo
  { bg: "#D9F2EE", body: "#0E8577", accent: "#4FC0AF", face: "#EFFBF8" }, // teal
  { bg: "#FCE1EC", body: "#C42A6B", accent: "#F07AA6", face: "#FEF1F6" }, // rosa
  { bg: "#FFE9D1", body: "#D9691A", accent: "#F6A868", face: "#FFF6EC" }, // laranja
  { bg: "#EFE1FB", body: "#7E33B0", accent: "#B87AE0", face: "#F9F1FE" }, // roxo
  { bg: "#DCEBFD", body: "#1E6FCC", accent: "#69A8F0", face: "#F0F7FF" }, // azul
  { bg: "#DFF2E1", body: "#2E8B45", accent: "#77C888", face: "#F1FAF2" }, // verde
  { bg: "#E4E9ED", body: "#4A6272", accent: "#8EA3B1", face: "#F3F6F8" }, // ardósia
  { bg: "#F3E6DD", body: "#8A5A3C", accent: "#C2937A", face: "#FBF4EF" }, // marrom
  { bg: "#FDE4DC", body: "#D24A2A", accent: "#F58C71", face: "#FEF2EE" }, // telha
];

export interface RobotAvatarProps {
  slug: string;
  /** Tamanho em px (largura = altura). Default 44. */
  size?: number;
  className?: string;
}

export function RobotAvatar({
  slug,
  size = 44,
  className,
}: RobotAvatarProps): React.JSX.Element {
  // `>>>` (shift sem sinal): mantém os canais não-negativos. Com `>>` (com
  // sinal), hashes grandes (>2^31) virariam negativos e `negativo % 4` não
  // bateria em 0..3 — deixando olhos/boca sem renderizar.
  const seed = agentSeed(slug);
  const palette = PALETTES[seed % PALETTES.length];
  const antenna = (seed >>> 4) % 4;
  const eyes = (seed >>> 8) % 4;
  const mouth = (seed >>> 12) % 4;
  const bigEars = ((seed >>> 16) & 1) === 1;

  const { bg, body, accent, face } = palette;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <circle cx="32" cy="32" r="32" fill={bg} />

      {/* Antena */}
      <g stroke={accent} strokeWidth="2" strokeLinecap="round" fill={accent}>
        {antenna === 0 && (
          <>
            <line x1="32" y1="20" x2="32" y2="12" />
            <circle cx="32" cy="10" r="3" stroke="none" />
          </>
        )}
        {antenna === 1 && (
          <>
            <line x1="32" y1="20" x2="32" y2="13" />
            <rect
              x="29"
              y="6"
              width="6"
              height="6"
              rx="1"
              transform="rotate(45 32 9)"
              stroke="none"
            />
          </>
        )}
        {antenna === 2 && (
          <>
            <line x1="26" y1="21" x2="24" y2="14" />
            <line x1="38" y1="21" x2="40" y2="14" />
            <circle cx="23" cy="12" r="2.4" stroke="none" />
            <circle cx="41" cy="12" r="2.4" stroke="none" />
          </>
        )}
        {antenna === 3 && (
          <>
            <line x1="32" y1="20" x2="32" y2="13" />
            <path d="M32 5 L36 12 L28 12 Z" stroke="none" />
          </>
        )}
      </g>

      {/* Orelhas */}
      <g fill={accent}>
        <rect
          x="12"
          y={bigEars ? 28 : 30}
          width="4"
          height={bigEars ? 12 : 8}
          rx="2"
        />
        <rect
          x="48"
          y={bigEars ? 28 : 30}
          width="4"
          height={bigEars ? 12 : 8}
          rx="2"
        />
      </g>

      {/* Cabeça */}
      <rect x="16" y="20" width="32" height="28" rx="9" fill={body} />

      {/* Painel do rosto */}
      <rect x="20" y="25" width="24" height="18" rx="6" fill={face} />

      {/* Olhos */}
      <g fill={body} stroke={body}>
        {eyes === 0 && (
          <g stroke="none">
            <circle cx="27" cy="32" r="2.6" />
            <circle cx="37" cy="32" r="2.6" />
          </g>
        )}
        {eyes === 1 && (
          <g stroke="none">
            <rect x="24.5" y="29.5" width="5" height="5.5" rx="1.6" />
            <rect x="34.5" y="29.5" width="5" height="5.5" rx="1.6" />
          </g>
        )}
        {eyes === 2 && (
          <rect x="24" y="30" width="16" height="4" rx="2" stroke="none" />
        )}
        {eyes === 3 && (
          <g fill="none" strokeWidth="2" strokeLinecap="round">
            <path d="M24.5 33 A3 3 0 0 1 30.5 33" />
            <path d="M33.5 33 A3 3 0 0 1 39.5 33" />
          </g>
        )}
      </g>

      {/* Boca */}
      <g stroke={body} fill={body}>
        {mouth === 0 && (
          <rect x="27" y="37.5" width="10" height="1.8" rx="0.9" stroke="none" />
        )}
        {mouth === 1 && (
          <path
            d="M27 37.5 A5 4 0 0 0 37 37.5"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        )}
        {mouth === 2 && (
          <g fill="none" strokeWidth="1.4">
            <rect x="26.5" y="36.5" width="11" height="3.4" rx="1" />
            <line x1="30" y1="36.5" x2="30" y2="39.9" />
            <line x1="34" y1="36.5" x2="34" y2="39.9" />
          </g>
        )}
        {mouth === 3 && (
          <rect x="29.5" y="37" width="5" height="2.6" rx="1.3" stroke="none" />
        )}
      </g>
    </svg>
  );
}
