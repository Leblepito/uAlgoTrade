"use client";

import React from "react";

export type DrawingTool = "cursor" | "horizontal_line" | "trend_line" | "rectangle" | "fibonacci";

interface DrawingToolbarProps {
    activeTool: DrawingTool;
    onToolChange: (tool: DrawingTool) => void;
    onClearAll: () => void;
    drawingCount: number;
}

const TOOLS: { id: DrawingTool; label: string; icon: React.ReactNode }[] = [
    {
        id: "cursor",
        label: "Seçim",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                <path d="M13 13l6 6" />
            </svg>
        ),
    },
    {
        id: "horizontal_line",
        label: "Yatay Çizgi",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
        ),
    },
    {
        id: "trend_line",
        label: "Trend Çizgisi",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="4" y1="20" x2="20" y2="4" />
            </svg>
        ),
    },
    {
        id: "rectangle",
        label: "Dikdörtgen",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="4" y="6" width="16" height="12" rx="1" />
            </svg>
        ),
    },
    {
        id: "fibonacci",
        label: "Fibonacci",
        icon: (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="3" y1="14" x2="21" y2="14" />
                <line x1="3" y1="18" x2="21" y2="18" />
                <line x1="5" y1="4" x2="19" y2="20" strokeDasharray="4 2" />
            </svg>
        ),
    },
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ activeTool, onToolChange, onClearAll, drawingCount }) => {
    return (
        <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1">
            {TOOLS.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => onToolChange(tool.id)}
                    title={tool.label}
                    className={`relative p-2 rounded-lg transition-all duration-200 ${activeTool === tool.id
                            ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10"
                            : "text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                >
                    {tool.icon}
                </button>
            ))}

            {drawingCount > 0 && (
                <>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button
                        onClick={onClearAll}
                        title="Tümünü Sil"
                        className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M3 6h18" />
                            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        </svg>
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono px-1">{drawingCount}</span>
                </>
            )}
        </div>
    );
};
