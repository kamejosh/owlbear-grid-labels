import { ContextWrapper } from "./ContextWrapper.tsx";
import { useEffect, useState } from "react";
import OBR, { buildText, Image, Item, Vector2, Text } from "@owlbear-rodeo/sdk";
import "./grid-labels.scss";
import { SceneReadyContext } from "../context/SceneReadyContext.ts";
import { gridLabelData } from "../helper/variables.ts";
import { mod } from "../helper/helpers.ts";
import { isUndefined, isEqual } from "lodash";

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

const addLabel = async (
    position: { x: number; y: number },
    text: string,
    size: number,
    scale: number,
    align: "LEFT" | "CENTER" | "RIGHT",
    width: number,
) => {
    const label = buildText()
        .textType("PLAIN")
        .position(position)
        .plainText(text)
        .locked(true)
        .fontWeight(600)
        .width(width / (scale / 2))
        .fillColor("white")
        .strokeColor("black")
        .strokeWidth(1)
        .fontSize(size)
        .scale({ x: scale, y: scale })
        .name("grid-label")
        .textAlignVertical("BOTTOM")
        .textAlign(align)
        .build();
    label.metadata[gridLabelData] = { isGridLabel: true };
    return label;
};

const Content = () => {
    const [viewport, setViewport] = useState<Viewport | null>(null);
    const [scale, setScale] = useState<number | undefined>(undefined);
    const [position, setPosition] = useState<{ x: number; y: number } | undefined>(undefined);
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
        const positionChanged = () => {
            if (viewport && viewport.position && position) {
                return viewport.position.x !== position.x || viewport.position.y !== position.y;
            } else {
                return false;
            }
        };
        const updateGrid = async () => {
            await addGridLabels();
            if (viewport) {
                setScale(viewport.scale);
                setPosition(viewport.position);
            }
        };
        if (viewport && (viewport.scale !== scale || positionChanged())) {
            updateGrid();
        }
    }, [viewport]);

    const addGridLabels = async () => {
        if (grid && grid.dpi && viewport && maps.length > 0) {
            const x: { min?: number; max?: number } = {};
            const y: { min?: number; max?: number } = {};

            maps.forEach((map) => {
                if (map.type === "IMAGE") {
                    const mapImage = map as Image;
                    // @ts-ignore
                    const scale = mapImage.scale.x * (grid.dpi / mapImage.grid.dpi);
                    if (isUndefined(x.min) || map.position.x < x.min) {
                        x.min = map.position.x;
                    }
                    if (!x.max || map.position.x + mapImage.image.width * scale > x.max) {
                        x.max = map.position.x + mapImage.image.width * scale;
                    }
                    if (isUndefined(y.min) || map.position.y < y.min) {
                        y.min = map.position.y;
                    }
                    if (!y.max || map.position.y + mapImage.image.height * scale > y.max) {
                        y.max = map.position.y + mapImage.image.height * scale;
                    }
                }
            });

            const labels: Array<Text> = [];
            let letter = 0;
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            let margin = 1;
            if (viewport.scale! < 0.2) {
                margin = 2;
            }
            if (viewport.scale! < 0.15) {
                margin = 3;
            }
            for (let i = x.min!; i < x.max!; i += grid.dpi!) {
                if (letter % margin === 0) {
                    const itteration = Math.floor(letter / letters.length);
                    let char = letters[mod(letter, letters.length)];
                    if (itteration >= 1) {
                        char = letters[mod(itteration - 1, letters.length)] + char;
                    }

                    const labelY = Math.max(
                        y.min! - 16 * (1 / viewport.scale!),
                        (viewport.position!.y / viewport.scale!) * -1,
                    );
                    const label = await addLabel(
                        { x: i, y: labelY },
                        char,
                        16,
                        0.8 / viewport.scale!,
                        "LEFT",
                        grid.dpi! * 3,
                    );
                    labels.push(label);
                }
                letter++;
            }

            letter = 1;
            for (let i = y.min!; i < y.max!; i += grid.dpi!) {
                if (letter % margin === 0) {
                    const labelX = Math.max(x.min! - 2 * grid.dpi!, (viewport.position!.x / viewport.scale!) * -1);
                    const label = await addLabel(
                        { x: labelX, y: i },
                        letter.toString(),
                        16,
                        1 / viewport.scale!,
                        "LEFT",
                        grid.dpi! * 3,
                    );
                    labels.push(label);
                }
                letter++;
            }

            await removeGridLabels();
            await OBR.scene.local.addItems(labels);
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
