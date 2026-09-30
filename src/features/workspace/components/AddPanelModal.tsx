import { useEffect, useState } from "react";
import { Modal } from "../../../shared/ui/Modal";
import { TOOLS } from "../../tools/registry";
import { useWorkspaceStore } from "../model/workspace.store";

export function AddPanelModal() {
  const open = useWorkspaceStore((s) => s.addPanelOpen);
  const closeAddPanel = useWorkspaceStore((s) => s.closeAddPanel);
  const addItem = useWorkspaceStore((s) => s.addItem);
  const [noSpace, setNoSpace] = useState(false);

  useEffect(() => {
    if (open) setNoSpace(false);
  }, [open]);

  return (
    <Modal open={open} title="Widget hinzufügen" onClose={closeAddPanel}>
      {noSpace && (
        <p role="alert" className="mb-3 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm">
          Auf diesem Layer ist kein Platz mehr frei. Verkleinere oder entferne ein Widget, oder
          lege einen neuen Layer an.
        </p>
      )}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        {TOOLS.map((tool) => (
          <li
            key={tool.id}
            className="flex flex-col gap-2 rounded-md border border-border bg-surface px-3 py-2.5"
          >
            <div>
              <div className="text-sm font-medium">{tool.titel}</div>
              <div className="text-xs text-text-muted">{tool.beschreibung}</div>
            </div>
            <div role="group" aria-label={`${tool.titel}: Größe wählen`} className="flex flex-wrap gap-1.5">
              {tool.sizes.map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setNoSpace(!addItem(tool.id, size.id))}
                  className={[
                    "min-h-[32px] rounded-md border px-2.5 text-xs transition-colors hover:border-accent hover:bg-surface-raised",
                    size.id === tool.standardSize
                      ? "border-accent/60 text-text"
                      : "border-border text-text-muted",
                  ].join(" ")}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
