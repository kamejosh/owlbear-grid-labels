import OBR, { Grid } from "@owlbear-rodeo/sdk";
import { PropsWithChildren, useEffect, useState } from "react";
import { PluginGate } from "../context/PluginGateContext.tsx";
import { useGridContext } from "../context/GridContext.tsx";
import { SceneReadyContext } from "../context/SceneReadyContext.ts";

export const ContextWrapper = (props: PropsWithChildren) => {
    const [ready, setReady] = useState<boolean>(false);
    const { isReady } = SceneReadyContext();
    const gridContext = useGridContext();

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(async () => {
                setReady(true);
            });
        }
    }, []);

    useEffect(() => {
        if (isReady && ready) {
            OBR.scene.grid.onChange((grid: Grid) => {
                gridContext.setGrid(grid);
            });
        }
    }, [ready, isReady]);

    return <PluginGate>{props.children}</PluginGate>;
};
