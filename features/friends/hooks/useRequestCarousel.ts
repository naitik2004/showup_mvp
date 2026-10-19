"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, WheelEvent } from "react";
import { Player } from "../types";

export function useRequestCarousel(players: Player[], disabled: boolean) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  const pointer = useRef<{ x: number; y: number; id: number } | null>(null);
  const lastWheel = useRef(0);
  const index = Math.max(
    0,
    players.findIndex((player) => player.id === activeId),
  );
  const move = (delta: number) => {
    if (disabled || players.length < 2) return;
    const next = (index + delta + players.length) % players.length;
    setDirection(delta > 0 ? "next" : "previous");
    setActiveId(players[next].id);
  };
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (
      disabled ||
      players.length < 2 ||
      !event.isPrimary ||
      event.button !== 0
    )
      return;
    if ((event.target as Element).closest("button,a,input,summary")) return;
    pointer.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x,
      dy = event.clientY - start.y;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.2)
      move(dx < 0 ? 1 : -1);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      event.target !== event.currentTarget ||
      !["ArrowLeft", "ArrowRight"].includes(event.key)
    )
      return;
    event.preventDefault();
    move(event.key === "ArrowRight" ? 1 : -1);
  };
  const onWheel = (event: WheelEvent<HTMLElement>) => {
    if (
      Math.abs(event.deltaX) < 24 ||
      Math.abs(event.deltaX) <= Math.abs(event.deltaY)
    )
      return;
    const now = Date.now();
    if (now - lastWheel.current < 400) return;
    lastWheel.current = now;
    move(event.deltaX > 0 ? 1 : -1);
  };
  return {
    index,
    player: players[index],
    direction,
    move,
    handlers: {
      onPointerDown,
      onPointerUp,
      onKeyDown,
      onWheel,
      onPointerCancel: () => {
        pointer.current = null;
      },
    },
  };
}
