"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

type QuadrantSliderProps = {
  sizePx?: number;
  onChange?: (x: number, y: number) => void;
  initialX?: number; // 0..1
  initialY?: number; // 0..1
  labelX?: string;
  labelY?: string;
};

/**
 * QuadrantSlider renders a square interactive area representing a single quadrant (x>=0, y>=0)
 * where users can drag a handle within the bounds to choose a 2D value in [0,1] x [0,1].
 */
export default function QuadrantSlider({
  sizePx = 360,
  onChange,
  initialX = 0.625,
  initialY = 0.625,
  labelX = "X",
  labelY = "Y",
}: QuadrantSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const GRID_CELLS = 4;
  const cellFromNormalized = (nx: number, ny: number) => {
    const col = Math.min(GRID_CELLS - 1, Math.max(0, Math.floor(clamp01(nx) * GRID_CELLS)));
    const row = Math.min(GRID_CELLS - 1, Math.max(0, Math.floor(clamp01(ny) * GRID_CELLS)));
    return { col, row } as const;
  };
  const centerOfCell = (col: number, row: number) => {
    return {
      nx: (col + 0.5) / GRID_CELLS,
      ny: (row + 0.5) / GRID_CELLS,
    } as const;
  };
  const initialCell = cellFromNormalized(initialX, initialY);
  const [activeCell, setActiveCell] = useState<{ col: number; row: number }>(initialCell);
  const initialCenter = centerOfCell(initialCell.col, initialCell.row);
  const [x, setX] = useState<number>(initialCenter.nx);
  const [y, setY] = useState<number>(initialCenter.ny);
  const [dragging, setDragging] = useState<boolean>(false);
  const [draggingX, setDraggingX] = useState<boolean>(false);
  const [draggingY, setDraggingY] = useState<boolean>(false);
  const handleSizePx = 24; // matches h-6 w-6
  const [showHint, setShowHint] = useState<boolean>(true);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const syncDisplayToActive = useCallback(() => {
    const c = centerOfCell(activeCell.col, activeCell.row);
    setX(c.nx);
    setY(c.ny);
    onChange?.(c.nx, c.ny);
  }, [activeCell, onChange]);

  const updateHoverFromClient = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const nx = clamp01((clientX - rect.left) / rect.width);
    const ny = clamp01((clientY - rect.top) / rect.height);
    const col = Math.min(3, Math.max(0, Math.floor(nx * 4)));
    const row = Math.min(3, Math.max(0, Math.floor(ny * 4)));
    setHoverCell({ col, row });
  }, []);

  const handlePointerPositionUpdate = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const nx = clamp01((clientX - rect.left) / rect.width);
      const ny = clamp01((clientY - rect.top) / rect.height);
      const cell = cellFromNormalized(nx, ny);
      setHoverCell(cell);
      const c = centerOfCell(cell.col, cell.row);
      setX(c.nx);
      setY(c.ny);
      onChange?.(c.nx, c.ny);
    },
    [onChange]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDragging(true);
      setShowHint(false);
      handlePointerPositionUpdate(e.clientX, e.clientY);
    },
    [handlePointerPositionUpdate]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // continuously update to hovered discrete cell
      handlePointerPositionUpdate(e.clientX, e.clientY);
    },
    [handlePointerPositionUpdate]
  );

  const endDrag = useCallback(() => setDragging(false), []);
  const clearHover = useCallback(() => setHoverCell(null), []);

  // Axis-only updates
  const updateXFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const nx = clamp01((clientX - rect.left) / rect.width);
      setX(nx);
      onChange?.(nx, y);
    },
    [onChange, y]
  );

  const updateYFromClientY = useCallback(
    (clientY: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ny = clamp01((clientY - rect.top) / rect.height);
      setY(ny);
      onChange?.(x, ny);
    },
    [onChange, x]
  );

  const onXPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDraggingX(true);
      setShowHint(false);
      updateXFromClientX(e.clientX);
    },
    [updateXFromClientX]
  );

  const onXPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!draggingX) return;
      e.stopPropagation();
      updateXFromClientX(e.clientX);
    },
    [draggingX, updateXFromClientX]
  );

  const endDragX = useCallback(() => setDraggingX(false), []);

  const onYPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDraggingY(true);
      setShowHint(false);
      updateYFromClientY(e.clientY);
    },
    [updateYFromClientY]
  );

  const onYPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!draggingY) return;
      e.stopPropagation();
      updateYFromClientY(e.clientY);
    },
    [draggingY, updateYFromClientY]
  );

  const endDragY = useCallback(() => setDraggingY(false), []);

  const sliderStyle = useMemo(() => {
    return {
      left: `${x * 100}%`,
      top: `${y * 100}%`,
    } as const;
  }, [x, y]);

  const hoverCellStyle = useMemo(() => {
    if (!hoverCell) return { display: "none" } as const;
    const col = Math.min(3, Math.max(0, hoverCell.col));
    const row = Math.min(3, Math.max(0, hoverCell.row));
    return {
      left: `${col * 25}%`,
      top: `${row * 25}%`,
      width: `25%`,
      height: `25%`,
    } as const;
  }, [hoverCell]);

  const activeCellStyle = useMemo(() => {
    const col = Math.min(3, Math.max(0, activeCell.col));
    const row = Math.min(3, Math.max(0, activeCell.row));
    return {
      left: `${col * 25}%`,
      top: `${row * 25}%`,
      width: `25%`,
      height: `25%`,
    } as const;
  }, [activeCell]);

  // Path highlight (use hovered cell if present, else active)
  const pathCell = hoverCell ?? activeCell;
  const verticalPathStyle = useMemo(() => {
    const cellSize = 100 / 4; // GRID_CELLS
    const col = Math.min(3, Math.max(0, pathCell.col));
    const row = Math.min(3, Math.max(0, pathCell.row));
    return {
      left: `${col * cellSize}%`,
      top: `0%`,
      width: `${cellSize}%`,
      height: `${(row + 1) * cellSize}%`,
    } as const;
  }, [pathCell]);
  const horizontalPathStyle = useMemo(() => {
    const cellSize = 100 / 4; // GRID_CELLS
    const col = Math.min(3, Math.max(0, pathCell.col));
    const row = Math.min(3, Math.max(0, pathCell.row));
    return {
      left: `0%`,
      top: `${row * cellSize}%`,
      width: `${(col + 1) * cellSize}%`,
      height: `${cellSize}%`,
    } as const;
  }, [pathCell]);

  const bubbleStyle = useMemo(() => {
    const xOffset = Math.round(handleSizePx / 2) + 8; // horizontal gap from handle
    const yOffset = Math.round(handleSizePx / 2) + 12; // move below the handle to avoid covering right arrow
    return {
      left: `calc(${x * 100}% + ${xOffset}px)`,
      top: `calc(${y * 100}% + ${yOffset}px)`,
    } as const;
  }, [x, y]);

  const hintRingStyle = useMemo(() => {
    const ringSize = Math.round(handleSizePx * 2.2);
    return {
      left: `${x * 100}%`,
      top: `${y * 100}%`,
      width: `${ringSize}px`,
      height: `${ringSize}px`,
    } as const;
  }, [x, y]);

  const quadrantScenario = useMemo(() => getQuadrantScenario(x, y), [x, y]);
  const responseTimeText = useMemo(() => getResponseTimeText(y), [y]);
  const sourcesText = useMemo(() => getSourcesText(x), [x]);
  const sourcesCount = useMemo(() => getSourcesCount(x), [x]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      setShowHint(false);
      let { col, row } = activeCell;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        col = Math.max(0, col - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        col = Math.min(3, col + 1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        row = Math.min(3, row + 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        row = Math.max(0, row - 1);
      } else {
        return;
      }
      const c = centerOfCell(col, row);
      setActiveCell({ col, row });
      setX(c.nx);
      setY(c.ny);
      onChange?.(c.nx, c.ny);
    },
    [activeCell, onChange]
  );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-[min(92vw,640px)]">
        <div
          ref={containerRef}
          data-quad-container
          className="relative aspect-square border border-white/15 bg-gradient-to-br from-zinc-900/80 to-zinc-900/20 shadow-sm overflow-visible"
          style={{ width: sizePx, maxWidth: "100%" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => {
            endDrag();
            if (hoverCell) {
              setActiveCell(hoverCell);
            }
          }}
          onPointerCancel={(e) => {
            endDrag();
            clearHover();
            syncDisplayToActive();
          }}
          onPointerLeave={(e) => {
            endDrag();
            clearHover();
            syncDisplayToActive();
          }}
          onKeyDown={onKeyDown}
          tabIndex={0}
        >
          {/* grid */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="border-[0.5px] border-white/10"
                />
              ))}
            </div>
            {/* active cell highlight (square) */}
            <div
              className="absolute bg-white/10 border border-white/15 rounded-none transition-all duration-150"
              style={activeCellStyle}
              aria-hidden
            />
            {/* hovered cell highlight */}
            <div
              className="absolute bg-white/5 border border-white/10 rounded-[4px] transition-all duration-75"
              style={hoverCellStyle}
              aria-hidden
            />
            {/* axes */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#4599DF]/90 shadow-[0_0_10px_rgba(69,153,223,0.55)]" />
            <div className="absolute left-0 right-0 top-0 h-[2px] bg-[#FFA73D]/90 shadow-[0_0_10px_rgba(255,167,61,0.55)]" />

            {/* extend axes slightly beyond container */}
            <div className="absolute top-0 right-0 translate-x-2 h-[2px] w-6 bg-[#FFA73D]/90" aria-hidden />
            <div className="absolute left-0 bottom-0 translate-y-2 w-[2px] h-6 bg-[#4599DF]/90" aria-hidden />

            {/* axis arrowheads */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-3 text-[#FFA73D]" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" aria-hidden>
                <path d="M8 5l8 7-8 7V5z" />
              </svg>
            </div>
            <div className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-3 text-[#4599DF]" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" aria-hidden>
                <path d="M12 19l-6-8h12l-6 8z" />
              </svg>
            </div>
          </div>

          {/* axis labels outside and parallel */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 -translate-x-1/2 -translate-y-[140%] md:-translate-y-[160%] text-xs md:text-sm text-[#FFA73D]" style={{ left: '15%' }}>
              <span className="select-none font-semibold">{labelX}</span>
            </div>
            <div className="absolute left-0 top-[15%] -translate-x-full rotate-90 text-xs md:text-sm text-[#4599DF]">
              <span className="select-none font-semibold">{labelY}</span>
            </div>
          </div>

          {/* path highlights (replace guide lines): from axes to current cell */}
          <div
            className="pointer-events-none absolute bg-white/5"
            style={verticalPathStyle}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bg-white/5"
            style={horizontalPathStyle}
            aria-hidden
          />

          {/* horizontal axis knob (display-only) */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            disabled
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-[#FFA73D] opacity-80 pointer-events-none"
            style={{ left: `${x * 100}%`, top: 0 }}
          />
          

          {/* vertical axis knob (display-only) */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            disabled
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-[#4599DF] opacity-80 pointer-events-none"
            style={{ left: 0, top: `${y * 100}%` }}
          />
          
          {/* axis foot labels */}
          {/* left axis: response time */}
          <div
            className="pointer-events-none absolute z-10 -translate-x-[110%] -translate-y-1/2 flex flex-col items-start gap-0.5 bg-[#0b0c0e] border border-white/10 rounded-md px-2 py-1 text-[12px] md:text-[13px] text-left whitespace-normal break-words max-w-[160px]"
            style={{ left: 0, top: `${y * 100}%` }}
            aria-hidden
          >
            <div className="flex items-center gap-1.5">
              <span className="text-foreground/70 font-normal">{responseTimeText}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3 h-3 text-foreground/60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <span className="text-foreground/50 text-[10px] md:text-[11px]">response time</span>
          </div>

          {/* top axis: resources (icons + count) */}
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[110%] flex flex-col items-start gap-0.5 bg-[#0b0c0e] border border-white/10 rounded-md px-2 py-1 text-[12px] md:text-[13px] text-left whitespace-normal break-words max-w-[200px]"
            style={{ left: `${x * 100}%`, top: 0 }}
            aria-hidden
          >
            <div className="flex items-center gap-1.5">
              <span className="text-foreground/70 font-normal">{getSourcesRangeLabel(x)}</span>
              {renderSourceIcons(sourcesText, true)}
            </div>
            <span className="text-foreground/50 text-[10px] md:text-[11px]">resources</span>
          </div>

          {false && (
            <div
              className="pointer-events-none absolute z-10 w-[220px] px-2 py-1 rounded-md text-[14px] leading-tight bg-zinc-900/95 border border-white/15 shadow"
              style={bubbleStyle}
            >
              <div className="text-foreground">{getScenarioLine(quadrantScenario)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function getScenarioSuggestions(x: number, y: number): string[] {
  const suggestions: string[] = [];
  // wide dimension
  if (x < 0.33) suggestions.push("聚焦少量主题");
  else if (x < 0.66) suggestions.push("适中范围");
  else suggestions.push("广域探索");

  // deep dimension
  if (y < 0.33) suggestions.push("浅层概览");
  else if (y < 0.66) suggestions.push("中等深度");
  else suggestions.push("深入研究");

  return suggestions;
}

type QuadrantScenario = { title: string; subtitle?: string };

function getQuadrantScenario(x: number, y: number): QuadrantScenario {
  const MID = 0.5;
  const isWideLow = x < MID;
  const isDeepLow = y < MID;

  // Bottom-left: low wide, low deep
  if (isWideLow && isDeepLow) {
    return {
      title: "Simple Q&A over a few files",
      subtitle: "Fast answers, minimal sources",
    };
  }

  // Top-left: low wide, high deep
  if (isWideLow && !isDeepLow) {
    return {
      title: "Deep research on a few files",
      subtitle: "Slower, higher reasoning depth",
    };
  }

  // Bottom-right: high wide, low deep
  if (!isWideLow && isDeepLow) {
    return {
      title: "Broad search and Q&A over many files",
      subtitle: "Fast answers, many sources",
    };
  }

  // Top-right: high wide, high deep
  return {
    title: "Broad and deep research across many files",
    subtitle: "Slower, high depth with many sources",
  };
}

function getResponseTimeText(y: number): string {
  if (y < 0.25) return "5s";
  if (y < 0.5) return "1min";
  if (y < 0.75) return "5min";
  return "10min";
}

function getSourcesText(x: number): string {
  if (x < 0.25) return "only web";
  if (x < 0.5) return "web + files";
  if (x < 0.75) return "web + files + database";
  return "web + files + database + images";
}

function getSourcesCount(x: number): string {
  if (x < 0.25) return "5";
  if (x < 0.5) return "10";
  if (x < 0.75) return "50";
  return "100";
}

function getSourcesRangeLabel(x: number): string {
  // More explicit label; could be customized later
  return getSourcesCount(x);
}

function renderSourceIcons(s: string, small = false): ReactNode {
  const sizeClass = small ? "w-3 h-3" : "w-4 h-4";
  const icons: ReactNode[] = [];
  const pushWeb = () => icons.push(
    <svg key={`web-${icons.length}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  );
  const pushFile = () => icons.push(
    <svg key={`file-${icons.length}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
  const pushDb = () => icons.push(
    <svg key={`db-${icons.length}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
  const pushImage = () => icons.push(
    <svg key={`img-${icons.length}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={sizeClass} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10.5" r="1.5" />
      <path d="M21 19l-5.5-5.5L9 19" />
    </svg>
  );

  if (s.includes("web")) pushWeb();
  if (s.includes("files")) pushFile();
  if (s.includes("database")) pushDb();
  if (s.includes("images")) pushImage();
  return <div className="flex items-center gap-1 text-foreground/60">{icons}</div>;
}

// removed team/people helpers

function getScenarioLine(s: QuadrantScenario): string {
  // Produce a concise one-line scenario; prefer title, append a short tag from subtitle if present
  if (!s.subtitle) return s.title;
  return `${s.title} — ${s.subtitle}`;
}


