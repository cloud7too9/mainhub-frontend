import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { selectActiveLayer, useWorkspaceStore } from "../model/workspace.store";
import {
  cellSize,
  cellToPixel,
  clampItemToGrid,
  type GridConfig,
  type PixelRect,
} from "../lib/layout-utils";
import { hasCollision } from "../lib/collision-utils";
import { getTool, getToolSize, getStandardSize } from "../../tools/registry";
import type { ToolSize } from "../../tools/tool.types";
import { nearestToolSize, resolveViewSize, sizeFitsAt } from "../lib/widget-sizes";
import type { Id } from "../../../shared/types/common.types";
import type { LayoutItem } from "../model/workspace.types";
import { WorkspacePanel } from "./WorkspacePanel";
import { EmptyGridHint } from "./EmptyGridHint";
import { useBreakpoint } from "../../../shared/hooks/useBreakpoint";
import { adaptLayoutToBreakpoint } from "../lib/responsive-layout";
import { useLongPress } from "../hooks/useLongPress";

/** Alle so viele Zellen wird eine kräftigere Hilfslinie gezeichnet. */
export const MAJOR_GRID_EVERY = 8;

type DragState =
  | { kind: "idle" }
  | {
      kind: "move";
      id: Id;
      pointerId: number;
      startPointer: { x: number; y: number };
      startCell: { x: number; y: number };
      previewCell: { x: number; y: number };
      valid: boolean;
    }
  | {
      kind: "resize";
      id: Id;
      pointerId: number;
      startPointer: { x: number; y: number };
      startSize: { w: number; h: number };
      /** Die Tool-Größe, auf die beim Loslassen eingerastet wird. */
      previewSize: ToolSize;
      valid: boolean;
    };

/** Gitterlinien als Hintergrund: feine Linien je Zelle, kräftige alle 8 Zellen. */
function gridLinesStyle(cell: { w: number; h: number }): CSSProperties {
  if (cell.w <= 0 || cell.h <= 0) return {};
  const minor = "rgb(var(--color-border) / 0.45)";
  const major = "rgb(var(--color-border-strong) / 0.55)";
  const mw = cell.w * MAJOR_GRID_EVERY;
  const mh = cell.h * MAJOR_GRID_EVERY;
  return {
    backgroundImage: [
      `linear-gradient(to right, ${major} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${major} 1px, transparent 1px)`,
      `linear-gradient(to right, ${minor} 1px, transparent 1px)`,
      `linear-gradient(to bottom, ${minor} 1px, transparent 1px)`,
    ].join(", "),
    backgroundSize: `${mw}px ${mh}px, ${mw}px ${mh}px, ${cell.w}px ${cell.h}px, ${cell.w}px ${cell.h}px`,
    // Rechter und unterer Rand der Fläche.
    boxShadow: `inset -1px -1px 0 ${major}`,
  };
}

export function WorkspaceGrid() {
  const layout = useWorkspaceStore(selectActiveLayer);
  const editMode = useWorkspaceStore((s) => s.editMode);
  const selectedPanelId = useWorkspaceStore((s) => s.selectedPanelId);
  const selectPanel = useWorkspaceStore((s) => s.selectPanel);
  const setEditMode = useWorkspaceStore((s) => s.setEditMode);
  const moveItem = useWorkspaceStore((s) => s.moveItem);
  const setItemSize = useWorkspaceStore((s) => s.setItemSize);

  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [drag, setDrag] = useState<DragState>({ kind: "idle" });

  // Die Fläche füllt den verfügbaren Platz; Breite und Höhe bestimmen die
  // Zellgröße. Die Seite selbst scrollt nie.
  useLayoutEffect(() => {
    const el = containerEl;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerEl]);

  // Das gespeicherte Layout liegt im Desktop-Raster. Für Tablet/Mobil wird
  // ein Layout mit weniger Spalten abgeleitet und in die Höhe eingepasst.
  // Verschieben/Skalieren ist nur im kanonischen Raster erlaubt.
  const breakpoint = useBreakpoint();
  const displayLayout = useMemo(
    () => adaptLayoutToBreakpoint(layout, breakpoint),
    [layout, breakpoint],
  );
  const canArrange = editMode && breakpoint.erlaubtAnordnen;

  // Langes Drücken auf die Kopfzeile eines Widgets (ohne Verschieben) schaltet
  // die gesamte Oberfläche in den Bearbeitungszustand.
  const longPress = useLongPress<Id>((id) => {
    selectPanel(id);
    setEditMode(true);
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
  });

  const config: GridConfig = useMemo(
    () => ({
      cols: displayLayout.spalten,
      rows: displayLayout.zeilen,
      gap: displayLayout.abstand,
      containerWidth: size.width,
      containerHeight: size.height,
    }),
    [displayLayout.spalten, displayLayout.zeilen, displayLayout.abstand, size],
  );
  const cell = cellSize(config);

  const onHeaderPointerDown = (e: ReactPointerEvent, id: Id) => {
    if (!editMode) {
      longPress.start(e, id);
      return;
    }
    if (!canArrange) return;
    e.preventDefault();
    const item = layout.items.find((i) => i.id === id);
    if (!item) return;
    selectPanel(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      kind: "move",
      id,
      pointerId: e.pointerId,
      startPointer: { x: e.clientX, y: e.clientY },
      startCell: { x: item.x, y: item.y },
      previewCell: { x: item.x, y: item.y },
      valid: true,
    });
  };

  const onResizePointerDown = (e: ReactPointerEvent, id: Id) => {
    if (!canArrange) return;
    e.preventDefault();
    e.stopPropagation();
    const item = layout.items.find((i) => i.id === id);
    const tool = item && getTool(item.tool);
    if (!item || !tool) return;
    selectPanel(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      kind: "resize",
      id,
      pointerId: e.pointerId,
      startPointer: { x: e.clientX, y: e.clientY },
      startSize: { w: item.w, h: item.h },
      previewSize: getToolSize(tool, item.size) ?? getStandardSize(tool),
      valid: true,
    });
  };

  useEffect(() => {
    if (!canArrange && drag.kind !== "idle") setDrag({ kind: "idle" });
  }, [canArrange, drag.kind]);

  useEffect(() => {
    if (drag.kind === "idle") return;
    if (cell.w <= 0 || cell.h <= 0) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      const item = layout.items.find((i) => i.id === drag.id);
      if (!item) return;
      const dx = (e.clientX - drag.startPointer.x) / cell.w;
      const dy = (e.clientY - drag.startPointer.y) / cell.h;

      if (drag.kind === "move") {
        const target = clampItemToGrid(
          {
            ...item,
            x: drag.startCell.x + Math.round(dx),
            y: drag.startCell.y + Math.round(dy),
          },
          layout.spalten,
          layout.zeilen,
        );
        setDrag({
          ...drag,
          previewCell: { x: target.x, y: target.y },
          valid: !hasCollision(target, layout.items),
        });
      } else {
        // Skalieren rastet auf die Größen ein, die das Tool anbietet.
        const tool = getTool(item.tool);
        if (!tool) return;
        const size = nearestToolSize(tool, drag.startSize.w + dx, drag.startSize.h + dy);
        setDrag({
          ...drag,
          previewSize: size,
          valid: sizeFitsAt(item, size, layout.items, layout.spalten, layout.zeilen),
        });
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== drag.pointerId) return;
      if (drag.kind === "move" && drag.valid) {
        moveItem(drag.id, drag.previewCell.x, drag.previewCell.y);
      }
      if (drag.kind === "resize" && drag.valid) {
        setItemSize(drag.id, drag.previewSize.id);
      }
      setDrag({ kind: "idle" });
    };

    const onCancel = () => setDrag({ kind: "idle" });

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [drag, cell.w, cell.h, layout, moveItem, setItemSize]);

  const hasSize = size.width > 0 && size.height > 0;

  return (
    <div
      ref={setContainerEl}
      data-breakpoint={breakpoint.name}
      data-grid={`${displayLayout.spalten}x${displayLayout.zeilen}`}
      className="relative h-full w-full overflow-hidden"
      style={editMode ? gridLinesStyle(cell) : undefined}
    >
      {displayLayout.items.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <EmptyGridHint />
        </div>
      ) : (
        hasSize &&
        displayLayout.items.map((item) => {
          const tool = getTool(item.tool);
          if (!tool) return null;
          const chosen = getToolSize(tool, item.size) ?? getStandardSize(tool);
          // In abgeleiteten Layouts (Tablet/Mobil) kann der Kasten kleiner
          // sein; dann zeigt das Tool die größte Ansicht, die hineinpasst.
          const viewSize = resolveViewSize(
            tool,
            chosen,
            (s) =>
              Math.round((s.w * displayLayout.spalten) / layout.spalten) <= item.w &&
              Math.round((s.h * displayLayout.zeilen) / layout.zeilen) <= item.h,
          );
          return (
            <WorkspacePanel
              key={item.id}
              item={item}
              tool={tool}
              viewSize={viewSize}
              rect={cellToPixel(item.x, item.y, item.w, item.h, config)}
              editMode={editMode}
              arrangeable={canArrange}
              selected={selectedPanelId === item.id}
              onHeaderPointerDown={onHeaderPointerDown}
              onResizePointerDown={onResizePointerDown}
            />
          );
        })
      )}
      {drag.kind !== "idle" && (
        <DragPreview drag={drag} config={config} layout={displayLayout.items} />
      )}
    </div>
  );
}

function DragPreview({
  drag,
  config,
  layout,
}: {
  drag: Exclude<DragState, { kind: "idle" }>;
  config: GridConfig;
  layout: LayoutItem[];
}) {
  const item = layout.find((i) => i.id === drag.id);
  if (!item) return null;
  let rect: PixelRect;
  if (drag.kind === "move") {
    rect = cellToPixel(drag.previewCell.x, drag.previewCell.y, item.w, item.h, config);
  } else {
    rect = cellToPixel(item.x, item.y, drag.previewSize.w, drag.previewSize.h, config);
  }
  return (
    <div
      data-testid="drag-preview"
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        pointerEvents: "none",
      }}
      className={[
        "rounded-panel border-2 border-dashed",
        drag.valid ? "border-accent bg-accent/10" : "border-danger bg-danger/10",
      ].join(" ")}
    >
      {drag.kind === "resize" && (
        <span className="absolute bottom-1 left-1.5 rounded bg-surface-raised px-1.5 py-0.5 text-[11px] text-text">
          {drag.previewSize.label}
        </span>
      )}
    </div>
  );
}
