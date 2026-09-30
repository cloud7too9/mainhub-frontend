import { describe, expect, it } from "vitest";
import { getTool } from "../features/tools/registry";
import {
  nearestToolSize,
  normalizeWidgets,
  resolveViewSize,
  sizeAndSmaller,
  sizeFitsAt,
} from "../features/workspace/lib/widget-sizes";
import { rectsOverlap } from "../features/workspace/lib/layout-utils";
import type { LayoutItem } from "../features/workspace/model/workspace.types";

const aufgaben = getTool("aufgaben")!;
const size = (id: string) => aufgaben.sizes.find((s) => s.id === id)!;

describe("nearestToolSize", () => {
  it("snaps a dragged size to the closest size the tool offers", () => {
    expect(nearestToolSize(aufgaben, 18, 9).id).toBe("klein");
    expect(nearestToolSize(aufgaben, 25, 15).id).toBe("mittel");
    expect(nearestToolSize(aufgaben, 40, 30).id).toBe("gross");
  });
});

describe("sizeAndSmaller", () => {
  it("lists the chosen size and all smaller ones, largest first", () => {
    expect(sizeAndSmaller(aufgaben, size("gross")).map((s) => s.id)).toEqual([
      "gross",
      "mittel",
      "klein",
    ]);
    expect(sizeAndSmaller(aufgaben, size("klein")).map((s) => s.id)).toEqual(["klein"]);
  });
});

describe("sizeAndSmaller with equal areas", () => {
  it("offers a same-area size of a different shape as fallback", () => {
    const toolstart = getTool("toolstart")!;
    const raster = toolstart.sizes.find((s) => s.id === "raster")!;
    expect(sizeAndSmaller(toolstart, raster).map((s) => s.id)).toEqual(["raster", "leiste"]);
  });
});

describe("resolveViewSize", () => {
  it("shows the chosen view when it fits", () => {
    expect(resolveViewSize(aufgaben, size("gross"), () => true).id).toBe("gross");
  });

  it("falls back to the largest smaller view that fits", () => {
    const fits = (s: { h: number }) => s.h <= 16;
    expect(resolveViewSize(aufgaben, size("gross"), fits).id).toBe("mittel");
  });

  it("never shows a larger view than chosen and ends at the smallest", () => {
    expect(resolveViewSize(aufgaben, size("mittel"), () => false).id).toBe("klein");
  });
});

describe("sizeFitsAt", () => {
  const item: LayoutItem = { id: "a", tool: "aufgaben", titel: "A", size: "klein", x: 0, y: 0, w: 16, h: 8 };

  it("checks edges and collisions", () => {
    expect(sizeFitsAt(item, size("gross"), [item], 96, 48)).toBe(true);
    expect(sizeFitsAt({ ...item, x: 80 }, size("gross"), [], 96, 48)).toBe(false);
    const other = { ...item, id: "b", x: 20 };
    expect(sizeFitsAt(item, size("mittel"), [item, other], 96, 48)).toBe(false);
  });
});

describe("normalizeWidgets", () => {
  it("migrates the old panelTyp field and fills the size", () => {
    const [w] = normalizeWidgets([{ id: "a", panelTyp: "aufgaben", titel: "A", x: 0, y: 0, w: 24, h: 16 }], 96, 48);
    expect(w).toMatchObject({ tool: "aufgaben", size: "mittel", w: 24, h: 16 });
  });

  it("resolves overlaps created by snapping, without losing widgets", () => {
    const out = normalizeWidgets(
      [
        { id: "a", tool: "aufgaben", size: "gross", x: 0, y: 0 },
        { id: "b", tool: "aufgaben", size: "gross", x: 10, y: 10 },
      ],
      96,
      48,
    );
    expect(out).toHaveLength(2);
    expect(rectsOverlap(out[0], out[1])).toBe(false);
  });
});
