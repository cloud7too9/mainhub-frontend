import type { Id } from "../../../shared/types/common.types";

/**
 * Ein Widget ist ein auf dem Raster platziertes Tool. Es bestimmt selbst,
 * in welcher der vom Tool angebotenen Größen es erscheint und wo es liegt.
 * `w` und `h` entsprechen immer der gewählten Größe des Tools.
 */
export interface LayoutItem {
  id: Id;
  /** ID des Tools, das Inhalte und verfügbare Größen bestimmt. */
  tool: string;
  titel: string;
  /** ID der gewählten Tool-Größe. */
  size: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Ein Layer ist eine eigenständige Widget-Anordnung. Der Workspace besteht
 * aus einem oder mehreren Layern, von denen genau einer aktiv angezeigt wird.
 */
export interface WorkspaceLayout {
  id: Id;
  name: string;
  /** Anzahl Rasterspalten der Fläche. */
  spalten: number;
  /** Anzahl Rasterzeilen der Fläche. Die Fläche scrollt nicht. */
  zeilen: number;
  /** Sichtbarer Abstand zwischen Widgets in Pixeln. */
  abstand: number;
  items: LayoutItem[];
}

/** Persistierter Zustand des gesamten Workspace. */
export interface WorkspaceData {
  layers: WorkspaceLayout[];
  activeLayerId: Id;
}
