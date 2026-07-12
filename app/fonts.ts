import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

/**
 * Tipografia do BusinessOS — Geist (design "Flux": grotesca geométrica, ótima
 * em pesos altos e tamanhos grandes).
 *
 * O pacote `geist` embute os arquivos localmente (sem chamada ao Google Fonts)
 * e expõe as variáveis `--font-geist-sans` / `--font-geist-mono`. Em
 * `app/layout.tsx` aplicamos ambas as `.variable` no `<html>`; em
 * `globals.css` mapeamos `--font-sans`/`--font-mono` para elas, de modo que o
 * resto do sistema (Tailwind `font-sans`/`font-mono`) continua referenciando
 * `--font-sans` sem saber qual é a família concreta.
 */
export const fontSans = GeistSans;
export const fontMono = GeistMono;

/** Classe a aplicar no `<html>` — publica as duas CSS vars da Geist. */
export const fontVariables = `${GeistSans.variable} ${GeistMono.variable}`;
