"use client";

import { useEffect, useState } from "react";
import { Clock } from "../icons";

function fmt(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

/**
 * Quiz countdown pill. Turns amber under 60s ("warn") and red at zero ("over").
 * When an absolute `deadline` (ISO) is given, the remaining time is recomputed
 * from it on mount — the server is the source of truth — otherwise it counts
 * down from `seconds`.
 */
export function Countdown({
  seconds,
  deadline,
}: {
  seconds: number;
  deadline?: string;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => {
      if (deadline) {
        // Recompute from the server deadline each tick (clock is authoritative).
        setLeft(
          Math.max(
            0,
            Math.floor((new Date(deadline).getTime() - Date.now()) / 1000),
          ),
        );
      } else {
        setLeft((v) => v - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [left, deadline]);

  const warn = left <= 60 && left > 0;
  const over = left <= 0;

  return (
    <span
      className={`timer${warn ? " warn-state" : ""}${over ? " over-state" : ""}`}
      id="timer"
    >
      <Clock />
      <span className={`mono${warn ? " warn" : ""}${over ? " over" : ""}`}>
        {fmt(Math.max(0, left))}
      </span>
    </span>
  );
}
