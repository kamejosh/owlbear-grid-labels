import { ContextWrapper } from "./ContextWrapper.tsx";
import { useEffect, useState } from "react";
import OBR, { buildText, Item, Vector2 } from "@owlbear-rodeo/sdk";
import "./grid-labels.scss";
import { SceneReadyContext } from "../context/SceneReadyContext.ts";
import { gridLabelData } from "../helper/variables.ts";

export const GridLabels = () => {
    return (
        <ContextWrapper>
            <Content />
        </ContextWrapper>
    );
};

type Grid = {
    scale?: { multiplier: number; unit: string; digits: number };
    dpi?: number;
};

type Viewport = {
    height?: number;
    width?: number;
    scale?: number;
    position?: Vector2;
};

const addLabel = async (position: { x: number; y: number }, text: string, size: number, scale: number) => {
    const label = buildText()
        .textType("PLAIN")
        .position(position)
        .plainText(text)
        .locked(true)
        .fontWeight(600)
        .fillColor("white")
        .strokeColor("black")
        .strokeWidth(1)
        .fontSize(size)
        .scale({ x: scale, y: scale })
        .name("grid-label")
        .build();
    label.metadata[gridLabelData] = { isGridLabel: true };
    await OBR.scene.local.addItems([label]);
};

const Content = () => {
    const [viewport, setViewport] = useState<Viewport | null>(null);
    const [scale, setScale] = useState<number | undefined>(undefined);
    const [grid, setGrid] = useState<Grid | null>(null);
    const [maps, setMaps] = useState<Array<Item>>([]);
    const { isReady } = SceneReadyContext();

    const updateViewport = async () => {
        const localViewport: Viewport = {};
        localViewport.height = await OBR.viewport.getHeight();
        localViewport.width = await OBR.viewport.getWidth();
        localViewport.scale = await OBR.viewport.getScale();
        localViewport.position = await OBR.viewport.getPosition();
        setViewport({ ...localViewport });
    };

    const initExtension = async () => {
        const localGrid: Grid = {};

        localGrid.scale = (await OBR.scene.grid.getScale()).parsed;
        localGrid.dpi = await OBR.scene.grid.getDpi();
        setGrid(localGrid);

        await updateViewport();

        const localMaps = await OBR.scene.items.getItems((item: Item) => item.layer === "MAP");
        setMaps(localMaps);
    };

    useEffect(() => {
        if (isReady) {
            setInterval(async () => {
                await updateViewport();
            }, 1000);
            initExtension();
        }
    }, [isReady]);

    useEffect(() => {
        const updateGrid = async () => {
            await removeGridLabels();
            await addGridLabels();
            if (viewport) {
                setScale(viewport.scale);
            }
        };
        if (viewport && viewport.scale !== scale) {
            updateGrid();
        }
    }, [viewport]);

    const addGridLabels = async () => {
        if (grid && viewport) {
            await addLabel(maps[0].position, "A", 16, 1 / viewport.scale!);
        }
    };

    const removeGridLabels = async () => {
        const labels = await OBR.scene.local.getItems((item) => gridLabelData in item.metadata);
        await OBR.scene.local.deleteItems(labels.map((label) => label.id));
    };

    return (
        <>
            <h1>Grid Labels</h1>
            <button onClick={addGridLabels}>Add Grid Labels</button>
            <button onClick={removeGridLabels}>Remove Grid Labels</button>
        </>
    );
};
