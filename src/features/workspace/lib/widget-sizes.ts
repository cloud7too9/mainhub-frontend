import type { ToolDefinition, ToolSize } from "../../tools/tool.types";
import { getStandardSize, getTool, getToolSize } from "../../tools/registry";
import type { LayoutItem } from "../model/workspace.types";
import { clampItemToGrid, findFreePosition, rectsOverlap, type Rect } from "./layout-utils";

const area = (s: { w: number; h: number }) => s.w * s.h;

/** Größen des Tools von klein nach groß. */
export function sizesAscending(tool: ToolDefinition): ToolSize[] {
  return [...tool.sizes].sort((a, b) => area(a) - area(b));
}

/**
 * Die gewählte Größe zuerst, danach alle anderen Größen, die nicht mehr
 * Fläche brauchen, von groß nach klein. Gleich große Größen anderer Form
 * (z. B. „Leiste“ statt „Raster“) zählen als Ausweichmöglichkeit.
 */
export function sizeAndSmaller(tool: ToolDefinition, size: ToolSize): ToolSize[] {
  const others = sizesAscending(tool)
    .filter((s) => s.id !== size.id && area(s) <= area(size))
    .reverse();
  return [size, ...others];
}

/** Die Tool-Größe, die einer gewünschten Breite × Höhe am nächsten kommt. */
export function nearestToolSize(tool: ToolDefinition, w: number, h: number): ToolSize {
  let best = tool.sizes[0];
  let bestDist = Infinity;
  for (const s of sizesAscending(tool)) {
    const dist = Math.abs(s.w - w) + Math.abs(s.h - h);
    if (dist < bestDist) {
      best = s;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Welche Ansicht in einem Kasten gezeigt wird, der kleiner sein kann als die
 * gewählte Größe (abgeleitete Layouts auf Tablet und Mobil): die größte
 * Größe bis einschließlich der gewählten, die hineinpasst, sonst die kleinste.
 */
export function resolveViewSize(
  tool: ToolDefinition,
  chosen: ToolSize,
  fits: (size: ToolSize) => boolean,
): ToolSize {
  const candidates = sizeAndSmaller(tool, chosen);
  return candidates.find(fits) ?? candidates[candidates.length - 1];
}

/** Kann das Widget an seiner Position die Größe `size` annehmen? */
export function sizeFitsAt(
  item: LayoutItem,
  size: ToolSize,
  others: LayoutItem[],
  cols: number,
  rows: number,
): boolean {
  if (item.x + size.w > cols || item.y + size.h > rows) return false;
  const candidate = { ...item, w: size.w, h: size.h };
  return !others.some((o) => o.id !== item.id && rectsOverlap(candidate, o));
}

/** Gespeicherte Widget-Daten, eventuell aus älteren Versionen. */
export type RawWidget = Partial<LayoutItem> & { panelTyp?: string };

let fallbackCounter = 0;

/**
 * Bringt gespeicherte Widgets in Einklang mit den aktuellen Tools:
 * unbekannte Tools werden verworfen, fehlende oder unbekannte Größen auf die
 * nächstliegende Tool-Größe eingerastet, `w`/`h` aus dem Tool übernommen.
 * Entsteht dadurch eine Überlappung, wird erst eine kleinere Größe an
 * derselben Stelle, dann ein freier Platz gesucht.
 */
export function normalizeWidgets(raw: RawWidget[], cols: number, rows: number): LayoutItem[] {
  const ordered = [...raw].sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0));
  const placed: LayoutItem[] = [];

  for (const r of ordered) {
    const tool = getTool(r.tool ?? r.panelTyp ?? "");
    if (!tool) continue;
    const std = getStandardSize(tool);
    const chosen =
      (r.size ? getToolSize(tool, r.size) : undefined) ??
      nearestToolSize(tool, r.w ?? std.w, r.h ?? std.h);

    const base: LayoutItem = {
      id: r.id ?? `widget-${tool.id}-${++fallbackCounter}`,
      tool: tool.id,
      titel: r.titel ?? tool.titel,
      size: chosen.id,
      x: r.x ?? 0,
      y: r.y ?? 0,
      w: chosen.w,
      h: chosen.h,
    };

    const candidates = sizeAndSmaller(tool, chosen);
    const collides = (it: Rect) => placed.some((p) => rectsOverlap(it, p));
    let result: LayoutItem | null = null;

    for (const s of candidates) {
      const it = clampItemToGrid({ ...base, size: s.id, w: s.w, h: s.h }, cols, rows);
      if (!collides(it)) {
        result = it;
        break;
      }
    }
    if (!result) {
      for (const s of candidates) {
        const pos = findFreePosition(placed, s.w, s.h, cols, rows);
        if (pos) {
          result = { ...base, ...pos, size: s.id, w: s.w, h: s.h };
          break;
        }
      }
    }
    // Letzter Ausweg bei voller Fläche: Widget behalten statt Daten zu verlieren.
    placed.push(result ?? clampItemToGrid(base, cols, rows));
  }

  return placed;
}
