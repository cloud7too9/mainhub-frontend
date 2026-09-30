import type { ComponentType } from "react";

/**
 * Eine Größe, die ein Tool anbietet. Jede Größe steht für eine eigene
 * Ansicht mit eigenem Umfang an Inhalten. Maße in Zellen des Desktop-Rasters
 * (96 × 48).
 */
export interface ToolSize {
  /** Vom Tool vergebene ID, eindeutig innerhalb des Tools. */
  id: string;
  /** Anzeigename, z. B. „Klein“ oder „Leiste“. */
  label: string;
  w: number;
  h: number;
}

export interface ToolViewProps {
  /** Die Größe, deren Ansicht gerendert werden soll. */
  size: ToolSize;
}

/**
 * Vertrag zwischen Tool und Oberfläche: Das Tool bestimmt Titel, Inhalte
 * und welche Größen es bereitstellt. Die Oberfläche stellt nur die Fläche;
 * Widgets (platzierte Tools) wählen daraus Größe und Position.
 */
export interface ToolDefinition {
  id: string;
  titel: string;
  beschreibung: string;
  /** Mindestens eine Größe, aufsteigend nach Fläche sortiert. */
  sizes: ToolSize[];
  /** ID der Größe, mit der ein neues Widget startet. */
  standardSize: string;
  View: ComponentType<ToolViewProps>;
}
