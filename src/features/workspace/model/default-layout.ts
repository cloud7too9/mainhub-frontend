import type { WorkspaceLayout } from "./workspace.types";

/**
 * Feines Raster: 96 × 48 Zellen auf Desktop. 96 ist durch 2, 3, 4, 6, 8, 12,
 * 16, 24 und 32 teilbar, 48 durch 2, 3, 4, 6, 8, 12, 16 und 24. So lassen
 * sich Hälften, Drittel und Viertel exakt abbilden.
 */
export const CANONICAL_SPALTEN = 96;
export const CANONICAL_ZEILEN = 48;

export const DEFAULT_LAYOUT: WorkspaceLayout = {
  id: "workspace-default",
  name: "Start",
  spalten: CANONICAL_SPALTEN,
  zeilen: CANONICAL_ZEILEN,
  abstand: 8,
  items: [
    {
      id: "panel-schnellnotiz",
      tool: "schnellnotiz",
      titel: "Schnellnotiz",
      size: "mittel",
      x: 0,
      y: 0,
      w: 24,
      h: 16,
    },
    {
      id: "panel-aufgaben",
      tool: "aufgaben",
      titel: "Aufgaben",
      size: "mittel",
      x: 24,
      y: 0,
      w: 24,
      h: 16,
    },
    {
      id: "panel-projektstatus",
      tool: "projektstatus",
      titel: "Projektstatus",
      size: "mittel",
      x: 48,
      y: 0,
      w: 32,
      h: 16,
    },
    {
      id: "panel-toolstart",
      tool: "toolstart",
      titel: "Tool-Start",
      size: "raster",
      x: 80,
      y: 0,
      w: 16,
      h: 16,
    },
    {
      id: "panel-dateien",
      tool: "dateien",
      titel: "Dateien",
      size: "mittel",
      x: 0,
      y: 16,
      w: 32,
      h: 16,
    },
    {
      id: "panel-letzteInhalte",
      tool: "letzteInhalte",
      titel: "Letzte Inhalte",
      size: "mittel",
      x: 32,
      y: 16,
      w: 32,
      h: 16,
    },
  ],
};
