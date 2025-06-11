import { Grid, Image, Vector2 } from "@owlbear-rodeo/sdk";
import { create } from "zustand";

export type Viewport = {
    height?: number;
    width?: number;
    scale?: number;
    position?: Vector2;
};

export type GridContextType = {
    grid: Grid | null;
    viewport: Viewport | null;
    maps: Array<Image>;
    setGrid: (grid: Grid) => void;
    setViewport: (viewport: Viewport) => void;
    setMaps: (maps: Array<Image>) => void;
};

export const useGridContext = create<GridContextType>()((set) => ({
    grid: null,
    viewport: null,
    maps: [],
    setGrid: (grid: Grid) =>
        set(() => {
            return { grid };
        }),
    setViewport: (viewport: Viewport) =>
        set(() => {
            return { viewport };
        }),
    setMaps: (maps: Array<Image>) =>
        set(() => {
            return { maps };
        }),
}));
