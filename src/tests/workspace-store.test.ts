import { beforeEach, describe, expect, it } from "vitest";
import {
  createInitialWorkspace,
  nextLayerName,
  selectActiveLayer,
  useWorkspaceStore,
} from "../features/workspace/model/workspace.store";
import { DEFAULT_LAYOUT } from "../features/workspace/model/default-layout";
import { loadWorkspaceFromStorage } from "../features/workspace/lib/storage";

const initialState = useWorkspaceStore.getState();
const store = () => useWorkspaceStore.getState();
const active = () => selectActiveLayer(store());

beforeEach(() => {
  localStorage.clear();
  useWorkspaceStore.setState(
    { ...initialState, ...createInitialWorkspace(), editMode: false, selectedPanelId: null },
    true,
  );
});

describe("initial state", () => {
  it("starts with a single default layer", () => {
    expect(store().layers).toHaveLength(1);
    expect(active().id).toBe(DEFAULT_LAYOUT.id);
    expect(active().items.length).toBe(DEFAULT_LAYOUT.items.length);
  });
});

describe("layers", () => {
  it("adds an empty layer, activates it and persists", () => {
    const id = store().addLayer();
    expect(store().layers).toHaveLength(2);
    expect(store().activeLayerId).toBe(id);
    expect(active().items).toEqual([]);
    expect(active().name).toBe("Layer 2");
    expect(loadWorkspaceFromStorage()!.activeLayerId).toBe(id);
  });

  it("uses a given name, trimmed", () => {
    store().addLayer("  Arbeit  ");
    expect(active().name).toBe("Arbeit");
  });

  it("generates unique default names", () => {
    const layers = [
      { ...DEFAULT_LAYOUT, id: "a", name: "Start" },
      { ...DEFAULT_LAYOUT, id: "b", name: "Layer 3" },
    ];
    expect(nextLayerName(layers)).toBe("Layer 4");
  });

  it("switches the active layer and clears the selection", () => {
    const second = store().addLayer();
    store().setActiveLayer(DEFAULT_LAYOUT.id);
    store().selectPanel("panel-aufgaben");
    store().setActiveLayer(second);
    expect(store().activeLayerId).toBe(second);
    expect(store().selectedPanelId).toBeNull();
  });

  it("ignores switching to an unknown layer", () => {
    store().setActiveLayer("gibt-es-nicht");
    expect(store().activeLayerId).toBe(DEFAULT_LAYOUT.id);
  });

  it("renames a layer and rejects empty names", () => {
    expect(store().renameLayer(DEFAULT_LAYOUT.id, "Privat")).toBe(true);
    expect(active().name).toBe("Privat");
    expect(store().renameLayer(DEFAULT_LAYOUT.id, "   ")).toBe(false);
    expect(active().name).toBe("Privat");
  });

  it("never removes the last layer", () => {
    expect(store().removeLayer(DEFAULT_LAYOUT.id)).toBe(false);
    expect(store().layers).toHaveLength(1);
  });

  it("activates the previous layer when the active one is removed", () => {
    const second = store().addLayer();
    const third = store().addLayer();
    store().setActiveLayer(second);
    expect(store().removeLayer(second)).toBe(true);
    expect(store().layers.map((l) => l.id)).toEqual([DEFAULT_LAYOUT.id, third]);
    expect(store().activeLayerId).toBe(DEFAULT_LAYOUT.id);
  });

  it("keeps the active layer when another one is removed", () => {
    const second = store().addLayer();
    store().removeLayer(DEFAULT_LAYOUT.id);
    expect(store().activeLayerId).toBe(second);
  });
});

describe("widgets act on the active layer only", () => {
  it("adds widgets to the active layer", () => {
    const second = store().addLayer();
    store().addItem("aufgaben");
    const layers = store().layers;
    expect(layers.find((l) => l.id === second)!.items).toHaveLength(1);
    expect(layers.find((l) => l.id === DEFAULT_LAYOUT.id)!.items.length).toBe(
      DEFAULT_LAYOUT.items.length,
    );
  });

  it("removes and duplicates within the active layer", () => {
    store().removeItem("panel-aufgaben");
    expect(active().items.some((i) => i.id === "panel-aufgaben")).toBe(false);
    store().duplicateItem("panel-dateien");
    expect(active().items.filter((i) => i.tool === "dateien")).toHaveLength(2);
  });

  it("moves a widget in fine steps and rejects collisions", () => {
    expect(store().moveItem("panel-toolstart", 67, 33)).toBe(true);
    expect(active().items.find((i) => i.id === "panel-toolstart")).toMatchObject({ x: 67, y: 32 });
    // Schnellnotiz liegt bei (0,0) – Kollision.
    expect(store().moveItem("panel-toolstart", 0, 0)).toBe(false);
  });

  it("keeps moved widgets inside the area (no scrolling below)", () => {
    store().moveItem("panel-toolstart", 80, 500);
    const t = active().items.find((i) => i.id === "panel-toolstart")!;
    expect(t.y + t.h).toBeLessThanOrEqual(active().zeilen);
  });

  it("switches between the sizes the tool offers, keeping the position", () => {
    // Dateien liegt bei (0,16) in „Mittel“ (32×16); darunter ist frei.
    expect(store().setItemSize("panel-dateien", "gross")).toBe(true);
    expect(active().items.find((i) => i.id === "panel-dateien")).toMatchObject({
      size: "gross",
      x: 0,
      y: 16,
      w: 32,
      h: 24,
    });
    expect(store().setItemSize("panel-aufgaben", "klein")).toBe(true);
    expect(active().items.find((i) => i.id === "panel-aufgaben")).toMatchObject({ w: 16, h: 8 });
  });

  it("rejects sizes that collide, leave the area or the tool does not offer", () => {
    // Aufgaben „Groß“ (32×24) würde in Projektstatus hineinragen.
    expect(store().setItemSize("panel-aufgaben", "gross")).toBe(false);
    // Tool-Start liegt am rechten Rand; „Leiste“ (32×8) passt dort nicht.
    expect(store().setItemSize("panel-toolstart", "leiste")).toBe(false);
    expect(store().setItemSize("panel-aufgaben", "riesig")).toBe(false);
    expect(active().items.find((i) => i.id === "panel-aufgaben")!.size).toBe("mittel");
  });

  it("adds widgets in the requested size and falls back to smaller sizes", () => {
    store().addLayer();
    expect(store().addItem("aufgaben", "klein")).toBe(true);
    expect(active().items[0]).toMatchObject({ tool: "aufgaben", size: "klein", w: 16, h: 8 });
    // Den Rest der Fläche bis auf einen 16×8-Streifen füllen.
    const l = store().layers.find((x) => x.id === store().activeLayerId)!;
    useWorkspaceStore.setState({
      layers: store().layers.map((x) =>
        x.id === l.id
          ? {
              ...x,
              items: [
                { id: "fill", tool: "letzteInhalte", titel: "F", size: "gross", x: 0, y: 8, w: 96, h: 40 },
                { id: "fill2", tool: "letzteInhalte", titel: "F", size: "gross", x: 32, y: 0, w: 64, h: 8 },
                ...x.items,
              ],
            }
          : x,
      ),
    });
    // „Groß“ passt nicht mehr, „Klein“ (16×8) schon – neben dem ersten Widget.
    expect(store().addItem("dateien", "gross")).toBe(true);
    expect(active().items.at(-1)).toMatchObject({ tool: "dateien", size: "klein", x: 16, y: 0 });
  });

  it("reports when a layer is full", () => {
    store().addLayer();
    let added = 0;
    while (store().addItem("toolstart")) added++;
    expect(added).toBeGreaterThan(0);
    expect(store().addItem("toolstart")).toBe(false);
    expect(store().duplicateItem(active().items[0].id)).toBe(false);
    for (const it of active().items) {
      expect(it.x + it.w).toBeLessThanOrEqual(active().spalten);
      expect(it.y + it.h).toBeLessThanOrEqual(active().zeilen);
    }
  });

  it("persists widget changes of the active layer", () => {
    const second = store().addLayer();
    store().addItem("dateien");
    const saved = loadWorkspaceFromStorage()!;
    expect(saved.layers.find((l) => l.id === second)!.items).toHaveLength(1);
  });
});

describe("resetActiveLayer", () => {
  it("restores default widgets on the start layer", () => {
    store().removeItem("panel-aufgaben");
    store().resetActiveLayer();
    expect(active().items.length).toBe(DEFAULT_LAYOUT.items.length);
  });

  it("empties a custom layer without touching others", () => {
    store().addLayer();
    store().addItem("aufgaben");
    store().resetActiveLayer();
    expect(active().items).toEqual([]);
    expect(store().layers[0].items.length).toBe(DEFAULT_LAYOUT.items.length);
  });
});

describe("loadWorkspace", () => {
  it("restores layers and the active layer from storage", () => {
    const second = store().addLayer("Arbeit");
    useWorkspaceStore.setState({ ...createInitialWorkspace() });
    store().loadWorkspace();
    expect(store().layers).toHaveLength(2);
    expect(store().activeLayerId).toBe(second);
    expect(active().name).toBe("Arbeit");
  });
});
