import type { PointerEvent as ReactPointerEvent } from "react";
import type { LayoutItem } from "../model/workspace.types";
import type { PixelRect } from "../lib/layout-utils";
import type { ToolDefinition, ToolSize } from "../../tools/tool.types";
import { PanelToolbar } from "./PanelToolbar";

interface Props {
  item: LayoutItem;
  tool: ToolDefinition;
  /** Ansicht, die das Tool rendern soll (kann auf Mobil kleiner sein als die gewählte Größe). */
  viewSize: ToolSize;
  rect: PixelRect;
  editMode: boolean;
  /** Verschieben/Skalieren erlaubt (Bearbeitungsmodus im Desktop-Raster). */
  arrangeable: boolean;
  selected: boolean;
  /** Kopfzeile: startet Verschieben (Bearbeitungszustand, Desktop) oder langes Drücken. */
  onHeaderPointerDown: (e: ReactPointerEvent, id: string) => void;
  onResizePointerDown: (e: ReactPointerEvent, id: string) => void;
}

/** Rahmen eines Widgets: Kopfzeile, Werkzeugleiste und die Ansicht des Tools. */
export function WorkspacePanel({
  item,
  tool,
  viewSize,
  rect,
  editMode,
  arrangeable,
  selected,
  onHeaderPointerDown,
  onResizePointerDown,
}: Props) {
  const View = tool.View;
  const canResize = arrangeable && tool.sizes.length > 1;
  return (
    <div
      data-panel-id={item.id}
      data-tool={tool.id}
      data-size={item.size}
      data-view-size={viewSize.id}
      style={{
        position: "absolute",
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
      className={[
        "flex flex-col overflow-hidden rounded-panel border bg-surface-muted transition-colors",
        editMode
          ? selected
            ? "border-accent shadow-lg shadow-accent/10"
            : "border-border-strong"
          : "border-border",
      ].join(" ")}
    >
      <div
        className={[
          "long-press-target flex items-center justify-between gap-2 border-b border-border px-2.5 py-1.5 text-sm font-medium sm:px-3",
          editMode ? "bg-surface-raised" : "",
          arrangeable ? "cursor-move touch-none" : "",
        ].join(" ")}
        onPointerDown={(e) => onHeaderPointerDown(e, item.id)}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="truncate">{item.titel}</span>
        {editMode && <PanelToolbar item={item} tool={tool} showSizes={arrangeable} />}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2.5">
        <View size={viewSize} />
      </div>
      {canResize && (
        <div
          role="presentation"
          aria-label="Größe ändern"
          onPointerDown={(e) => onResizePointerDown(e, item.id)}
          className="absolute bottom-1 right-1 h-4 w-4 cursor-nwse-resize touch-none rounded-sm border border-border-strong bg-surface-raised"
        />
      )}
    </div>
  );
}
