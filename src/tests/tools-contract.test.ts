import { describe, expect, it } from "vitest";
import { TOOLS, getStandardSize, getTool } from "../features/tools/registry";
import { CANONICAL_SPALTEN, CANONICAL_ZEILEN } from "../features/workspace/model/default-layout";
import { DEFAULT_LAYOUT } from "../features/workspace/model/default-layout";

/**
 * Vertrag zwischen Tools und Oberfläche: Jedes Tool muss diese Regeln
 * erfüllen, damit die Fläche seine Widgets platzieren kann.
 */
describe("tool contract", () => {
  it("has unique tool ids", () => {
    const ids = TOOLS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const tool of TOOLS) {
    describe(tool.id, () => {
      it("offers at least one size with unique ids", () => {
        expect(tool.sizes.length).toBeGreaterThanOrEqual(1);
        const ids = tool.sizes.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it("has sizes that fit into the canonical grid", () => {
        for (const s of tool.sizes) {
          expect(Number.isInteger(s.w) && Number.isInteger(s.h)).toBe(true);
          expect(s.w).toBeGreaterThanOrEqual(1);
          expect(s.h).toBeGreaterThanOrEqual(1);
          expect(s.w).toBeLessThanOrEqual(CANONICAL_SPALTEN);
          expect(s.h).toBeLessThanOrEqual(CANONICAL_ZEILEN);
        }
      });

      it("lists sizes in ascending order of area", () => {
        const areas = tool.sizes.map((s) => s.w * s.h);
        expect(areas).toEqual([...areas].sort((a, b) => a - b));
      });

      it("names an existing standard size", () => {
        expect(tool.sizes.some((s) => s.id === tool.standardSize)).toBe(true);
        expect(getStandardSize(tool).id).toBe(tool.standardSize);
      });

      it("has a title and a view", () => {
        expect(tool.titel.length).toBeGreaterThan(0);
        expect(typeof tool.View).toBe("function");
      });
    });
  }

  it("offers different numbers of sizes per tool (tools decide)", () => {
    expect(new Set(TOOLS.map((t) => t.sizes.length)).size).toBeGreaterThan(1);
  });

  it("default layout only uses existing tools and their sizes", () => {
    for (const item of DEFAULT_LAYOUT.items) {
      const tool = getTool(item.tool);
      expect(tool).toBeDefined();
      const size = tool!.sizes.find((s) => s.id === item.size);
      expect(size).toBeDefined();
      expect({ w: item.w, h: item.h }).toEqual({ w: size!.w, h: size!.h });
    }
  });
});
