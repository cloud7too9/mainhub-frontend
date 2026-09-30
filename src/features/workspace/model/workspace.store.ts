import { create } from "zustand";
import type { Id } from "../../../shared/types/common.types";
import type { LayoutItem, WorkspaceData, WorkspaceLayout } from "./workspace.types";
import { DEFAULT_LAYOUT } from "./default-layout";
import type { ToolDefinition, ToolSize } from "../../tools/tool.types";
import { getStandardSize, getTool, getToolSize } from "../../tools/registry";
import { clampItemToGrid, findFreePosition } from "../lib/layout-utils";
import { hasCollision } from "../lib/collision-utils";
import { sizeAndSmaller, sizeFitsAt } from "../lib/widget-sizes";
import { loadWorkspaceFromStorage, saveWorkspaceToStorage } from "../lib/storage";

export const LAYER_NAME_MAX_LENGTH = 40;

interface WorkspaceState {
  layers: WorkspaceLayout[];
  activeLayerId: Id;
  editMode: boolean;
  selectedPanelId: Id | null;
  addPanelOpen: boolean;

  setEditMode: (value: boolean) => void;
  toggleEditMode: () => void;
  selectPanel: (id: Id | null) => void;
  openAddPanel: () => void;
  closeAddPanel: () => void;

  // Widgets – wirken immer auf den aktiven Layer.
  moveItem: (id: Id, x: number, y: number) => boolean;
  /**
   * Wechselt ein Widget auf eine andere vom Tool angebotene Größe. Die
   * Position bleibt; false, wenn die Größe dort nicht passt.
   */
  setItemSize: (id: Id, sizeId: string) => boolean;
  /**
   * Fügt ein Widget des Tools hinzu, in der gewünschten oder der
   * Standardgröße; ist dafür kein Platz, in der nächstkleineren.
   * false, wenn auf dem Layer kein Platz mehr frei ist.
   */
  addItem: (toolId: string, sizeId?: string) => boolean;
  removeItem: (id: Id) => void;
  /** false, wenn auf dem Layer kein Platz mehr frei ist. */
  duplicateItem: (id: Id) => boolean;

  // Layer
  setActiveLayer: (id: Id) => void;
  addLayer: (name?: string) => Id;
  renameLayer: (id: Id, name: string) => boolean;
  removeLayer: (id: Id) => boolean;
  resetActiveLayer: () => void;

  loadWorkspace: () => void;
}

function cloneLayout(layout: WorkspaceLayout): WorkspaceLayout {
  return { ...layout, items: layout.items.map((i) => ({ ...i })) };
}

function nextId(prefix: string): Id {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

/** Der aktive Layer; fällt auf den ersten zurück, falls die ID ungültig ist. */
export function selectActiveLayer(
  state: Pick<WorkspaceState, "layers" | "activeLayerId">,
): WorkspaceLayout {
  return state.layers.find((l) => l.id === state.activeLayerId) ?? state.layers[0];
}

export function nextLayerName(layers: WorkspaceLayout[]): string {
  const names = new Set(layers.map((l) => l.name));
  let n = layers.length + 1;
  while (names.has(`Layer ${n}`)) n++;
  return `Layer ${n}`;
}

function normalizeLayerName(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, LAYER_NAME_MAX_LENGTH);
}

/**
 * Sucht Platz für ein Widget: zuerst in der gewünschten Größe, dann in den
 * kleineren Größen des Tools. `null`, wenn die Fläche voll ist.
 */
function findSlot(
  layout: WorkspaceLayout,
  tool: ToolDefinition,
  preferred: ToolSize,
): { x: number; y: number; w: number; h: number; size: string } | null {
  for (const size of sizeAndSmaller(tool, preferred)) {
    const pos = findFreePosition(layout.items, size.w, size.h, layout.spalten, layout.zeilen);
    if (pos) return { ...pos, w: size.w, h: size.h, size: size.id };
  }
  return null;
}

export function createInitialWorkspace(): WorkspaceData {
  const first = cloneLayout(DEFAULT_LAYOUT);
  return { layers: [first], activeLayerId: first.id };
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
  /** Setzt Layer-Daten und speichert sie. */
  const commit = (data: WorkspaceData, extra: Partial<WorkspaceState> = {}) => {
    set({ ...data, ...extra });
    saveWorkspaceToStorage(data);
  };

  /** Ersetzt die Widgets des aktiven Layers. */
  const commitActiveItems = (items: LayoutItem[], extra: Partial<WorkspaceState> = {}) => {
    const { layers, activeLayerId } = get();
    const active = selectActiveLayer(get());
    const next = layers.map((l) => (l.id === active.id ? { ...l, items } : l));
    commit({ layers: next, activeLayerId }, extra);
  };

  return {
    ...createInitialWorkspace(),
    editMode: false,
    selectedPanelId: null,
    addPanelOpen: false,

    setEditMode: (value) => {
      set({ editMode: value, selectedPanelId: value ? get().selectedPanelId : null });
    },
    toggleEditMode: () => get().setEditMode(!get().editMode),
    selectPanel: (id) => set({ selectedPanelId: id }),
    openAddPanel: () => set({ addPanelOpen: true }),
    closeAddPanel: () => set({ addPanelOpen: false }),

    moveItem: (id, x, y) => {
      const layout = selectActiveLayer(get());
      const target = layout.items.find((i) => i.id === id);
      if (!target) return false;
      const candidate = clampItemToGrid({ ...target, x, y }, layout.spalten, layout.zeilen);
      if (candidate.x === target.x && candidate.y === target.y) return false;
      if (hasCollision(candidate, layout.items)) return false;
      commitActiveItems(layout.items.map((i) => (i.id === id ? candidate : i)));
      return true;
    },

    setItemSize: (id, sizeId) => {
      const layout = selectActiveLayer(get());
      const target = layout.items.find((i) => i.id === id);
      const tool = target && getTool(target.tool);
      const size = tool && getToolSize(tool, sizeId);
      if (!target || !size || size.id === target.size) return false;
      if (!sizeFitsAt(target, size, layout.items, layout.spalten, layout.zeilen)) return false;
      const next = { ...target, size: size.id, w: size.w, h: size.h };
      commitActiveItems(layout.items.map((i) => (i.id === id ? next : i)));
      return true;
    },

    addItem: (toolId, sizeId) => {
      const layout = selectActiveLayer(get());
      const tool = getTool(toolId);
      if (!tool) return false;
      const preferred = (sizeId && getToolSize(tool, sizeId)) || getStandardSize(tool);
      const slot = findSlot(layout, tool, preferred);
      if (!slot) return false;
      const item: LayoutItem = {
        id: nextId(`widget-${tool.id}`),
        tool: tool.id,
        titel: tool.titel,
        ...slot,
      };
      commitActiveItems([...layout.items, item], { addPanelOpen: false });
      return true;
    },

    removeItem: (id) => {
      const layout = selectActiveLayer(get());
      const { selectedPanelId } = get();
      commitActiveItems(
        layout.items.filter((i) => i.id !== id),
        { selectedPanelId: selectedPanelId === id ? null : selectedPanelId },
      );
    },

    duplicateItem: (id) => {
      const layout = selectActiveLayer(get());
      const target = layout.items.find((i) => i.id === id);
      const tool = target && getTool(target.tool);
      if (!target || !tool) return false;
      const size = getToolSize(tool, target.size) ?? getStandardSize(tool);
      const slot = findSlot(layout, tool, size);
      if (!slot) return false;
      commitActiveItems([...layout.items, { ...target, id: nextId(`widget-${tool.id}`), ...slot }]);
      return true;
    },

    setActiveLayer: (id) => {
      const { layers, activeLayerId } = get();
      if (id === activeLayerId || !layers.some((l) => l.id === id)) return;
      commit({ layers, activeLayerId: id }, { selectedPanelId: null });
    },

    addLayer: (name) => {
      const { layers } = get();
      const normalized = name ? normalizeLayerName(name) : "";
      const layer: WorkspaceLayout = {
        id: nextId("layer"),
        name: normalized || nextLayerName(layers),
        spalten: DEFAULT_LAYOUT.spalten,
        zeilen: DEFAULT_LAYOUT.zeilen,
        abstand: DEFAULT_LAYOUT.abstand,
        items: [],
      };
      commit({ layers: [...layers, layer], activeLayerId: layer.id }, { selectedPanelId: null });
      return layer.id;
    },

    renameLayer: (id, name) => {
      const { layers, activeLayerId } = get();
      const normalized = normalizeLayerName(name);
      const target = layers.find((l) => l.id === id);
      if (!target || !normalized || normalized === target.name) return false;
      commit({
        layers: layers.map((l) => (l.id === id ? { ...l, name: normalized } : l)),
        activeLayerId,
      });
      return true;
    },

    removeLayer: (id) => {
      const { layers, activeLayerId } = get();
      if (layers.length <= 1) return false;
      const index = layers.findIndex((l) => l.id === id);
      if (index === -1) return false;
      const next = layers.filter((l) => l.id !== id);
      // Wird der aktive Layer entfernt, rückt der vorherige (oder der erste) nach.
      const nextActive =
        activeLayerId === id ? next[Math.max(0, index - 1)].id : activeLayerId;
      commit({ layers: next, activeLayerId: nextActive }, { selectedPanelId: null });
      return true;
    },

    resetActiveLayer: () => {
      const active = selectActiveLayer(get());
      // Der Start-Layer kehrt zu den Standard-Widgets zurück, eigene Layer
      // werden geleert (ihr Ausgangszustand).
      const items =
        active.id === DEFAULT_LAYOUT.id ? cloneLayout(DEFAULT_LAYOUT).items : [];
      commitActiveItems(items, { selectedPanelId: null });
    },

    loadWorkspace: () => {
      const loaded = loadWorkspaceFromStorage();
      if (loaded) set({ ...loaded, selectedPanelId: null });
    },
  };
});
