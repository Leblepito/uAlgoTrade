
export type DrawingType = "horizontal_line" | "trend_line" | "rectangle" | "fibonacci";

export interface Drawing {
    id: string;
    type: DrawingType;
    color: string;
    points: { price: number; time: number }[];
    price?: number;
    serverId?: string;
}

export interface DrawingState {
    drawings: Drawing[];
    activeDrawing: Drawing | null;
    isDrawing: boolean;
}

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS = [
    "rgba(239,83,80,0.8)",
    "rgba(255,152,0,0.7)",
    "rgba(255,235,59,0.7)",
    "rgba(76,175,80,0.7)",
    "rgba(33,150,243,0.7)",
    "rgba(156,39,176,0.7)",
    "rgba(239,83,80,0.8)",
];

export function createDrawingState(): DrawingState {
    return { drawings: [], activeDrawing: null, isDrawing: false };
}

export function generateDrawingId(): string {
    return `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function renderDrawings(
    ctx: CanvasRenderingContext2D,
    state: DrawingState,
    priceToY: (price: number) => number | null,
    timeToX: (time: number) => number | null,
    paneWidth: number,
    paneHeight: number,
): void {
    const allDrawings = [...state.drawings];
    if (state.activeDrawing) allDrawings.push(state.activeDrawing);

    for (const drawing of allDrawings) {
        ctx.save();

        switch (drawing.type) {
            case "horizontal_line":
                drawHorizontalLine(ctx, drawing, priceToY, paneWidth);
                break;
            case "trend_line":
                drawTrendLine(ctx, drawing, priceToY, timeToX);
                break;
            case "rectangle":
                drawRectangle(ctx, drawing, priceToY, timeToX);
                break;
            case "fibonacci":
                drawFibonacci(ctx, drawing, priceToY, timeToX, paneWidth);
                break;
        }

        ctx.restore();
    }
}

function drawHorizontalLine(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    priceToY: (p: number) => number | null,
    paneWidth: number,
): void {
    const price = drawing.price ?? drawing.points[0]?.price;
    if (price == null) return;
    const y = priceToY(price);
    if (y == null) return;

    ctx.strokeStyle = drawing.color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(paneWidth, y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.fillStyle = drawing.color;
    ctx.font = "bold 11px ui-sans-serif, system-ui, -apple-system";
    const text = price.toLocaleString(undefined, { maximumFractionDigits: 6 });
    const tm = ctx.measureText(text);
    const labelX = paneWidth - tm.width - 8;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(labelX - 4, y - 9, tm.width + 8, 18);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.fillText(text, labelX, y + 4);
}

function drawTrendLine(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    priceToY: (p: number) => number | null,
    timeToX: (t: number) => number | null,
): void {
    if (drawing.points.length < 2) return;

    const x1 = timeToX(drawing.points[0].time);
    const y1 = priceToY(drawing.points[0].price);
    const x2 = timeToX(drawing.points[1].time);
    const y2 = priceToY(drawing.points[1].price);

    if (x1 == null || y1 == null || x2 == null || y2 == null) return;

    ctx.strokeStyle = drawing.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    for (const [px, py] of [[x1, y1], [x2, y2]]) {
        ctx.fillStyle = drawing.color;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawRectangle(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    priceToY: (p: number) => number | null,
    timeToX: (t: number) => number | null,
): void {
    if (drawing.points.length < 2) return;

    const x1 = timeToX(drawing.points[0].time);
    const y1 = priceToY(drawing.points[0].price);
    const x2 = timeToX(drawing.points[1].time);
    const y2 = priceToY(drawing.points[1].price);

    if (x1 == null || y1 == null || x2 == null || y2 == null) return;

    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    ctx.fillStyle = drawing.color.replace(/[\d.]+\)$/g, "0.1)");
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = drawing.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(left, top, w, h);
}

function drawFibonacci(
    ctx: CanvasRenderingContext2D,
    drawing: Drawing,
    priceToY: (p: number) => number | null,
    timeToX: (t: number) => number | null,
    paneWidth: number,
): void {
    if (drawing.points.length < 2) return;

    const p0 = drawing.points[0].price;
    const p1 = drawing.points[1].price;
    const diff = p1 - p0;

    for (let i = 0; i < FIB_LEVELS.length; i++) {
        const level = FIB_LEVELS[i];
        const price = p0 + diff * level;
        const y = priceToY(price);
        if (y == null) continue;

        ctx.strokeStyle = FIB_COLORS[i];
        ctx.lineWidth = 1;
        ctx.setLineDash(level === 0 || level === 1 ? [] : [4, 2]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(paneWidth, y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.fillStyle = FIB_COLORS[i];
        ctx.font = "10px ui-monospace, SFMono-Regular, monospace";
        ctx.globalAlpha = 0.9;
        const text = `${(level * 100).toFixed(1)}% â€” ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        ctx.fillText(text, 8, y - 4);
        ctx.globalAlpha = 1;
    }

    const x1 = timeToX(drawing.points[0].time);
    const y1 = priceToY(drawing.points[0].price);
    const x2 = timeToX(drawing.points[1].time);
    const y2 = priceToY(drawing.points[1].price);
    if (x1 != null && y1 != null && x2 != null && y2 != null) {
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

export const DRAWING_COLORS = [
    "rgba(0,188,212,0.8)",    // cyan
    "rgba(255,152,0,0.8)",    // orange
    "rgba(156,39,176,0.8)",   // purple
    "rgba(76,175,80,0.8)",    // green
    "rgba(239,83,80,0.8)",    // red
    "rgba(33,150,243,0.8)",   // blue
    "rgba(255,235,59,0.8)",   // yellow
];

let colorIndex = 0;
export function nextDrawingColor(): string {
    const color = DRAWING_COLORS[colorIndex % DRAWING_COLORS.length];
    colorIndex++;
    return color;
}
