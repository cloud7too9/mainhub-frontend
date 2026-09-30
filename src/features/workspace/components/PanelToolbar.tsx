import { IconButton } from "../../../shared/ui/IconButton";
import { selectActiveLayer, useWorkspaceStore } from "../model/workspace.store";
import type { LayoutItem } from "../model/workspace.types";
import type { ToolDefinition } from "../../tools/tool.types";
import { sizeFitsAt } from "../lib/widget-sizes";

interface Props {
  item: LayoutItem;
  tool: ToolDefinition;
  /** Größenwahl anzeigen (nur wo Anordnen erlaubt ist, also im Desktop-Raster). */
  showSizes: boolean;
}

export function PanelToolbar({ item, tool, showSizes }: Props) {
  const duplicateItem = useWorkspaceStore((s) => s.duplicateItem);
  const removeItem = useWorkspaceStore((s) => s.removeItem);
  const setItemSize = useWorkspaceStore((s) => s.setItemSize);
  const layout = useWorkspaceStore(selectActiveLayer);

  return (
    <div className="flex shrink-0 items-center gap-0.5" onPointerDown={(e) => e.stopPropagation()}>
      {showSizes && tool.sizes.length > 1 && (
        <div role="group" aria-label="Größe" className="mr-1 flex items-center gap-0.5">
          {tool.sizes.map((size) => {
            const active = size.id === item.size;
            const fits = active || sizeFitsAt(item, size, layout.items, layout.spalten, layout.zeilen);
            return (
              <button
                key={size.id}
                type="button"
                onClick={() => setItemSize(item.id, size.id)}
                disabled={!fits}
                aria-pressed={active}
                aria-label={`Größe ${size.label}`}
                title={fits ? size.label : `${size.label} – hier kein Platz`}
                className={[
                  "inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded px-1 text-[11px] font-semibold",
                  active
                    ? "bg-accent text-surface"
                    : "text-text-muted hover:bg-surface hover:text-text disabled:pointer-events-none disabled:opacity-30",
                ].join(" ")}
              >
                {size.label.charAt(0)}
              </button>
            );
          })}
        </div>
      )}
      <IconButton label="Duplizieren" onClick={() => duplicateItem(item.id)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <rect x="4" y="4" width="11" height="11" rx="2" />
        </svg>
      </IconButton>
      <IconButton
        label="Entfernen"
        onClick={() => removeItem(item.id)}
        className="hover:bg-danger/20 hover:text-danger"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </IconButton>
    </div>
  );
}
