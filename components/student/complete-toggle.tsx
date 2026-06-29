"use client";

import { useState } from "react";
import { markComplete } from "@/app/actions/progress";

export function CompleteToggle({
  meetingId,
  itemType,
  itemId,
  initialDone,
  label,
}: {
  meetingId: string;
  itemType: "material" | "video";
  itemId: string;
  initialDone: boolean;
  label: string;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, setPending] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.checked;
    setDone(next);
    setPending(true);
    await markComplete(meetingId, itemType, itemId, next);
    setPending(false);
  }

  return (
    <label className="checkrow">
      <input type="checkbox" checked={done} onChange={onChange} disabled={pending} />
      {label}
    </label>
  );
}
