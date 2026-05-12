"use client";

import { useEffect } from "react";

export default function ViewTracker({ jobId }: { jobId: number | string }) {
  useEffect(() => {
    // Only track once per session to avoid artificial inflation during development/hot-reloads
    const tracked = sessionStorage.getItem(`tracked_job_${jobId}`);
    if (!tracked) {
      fetch("/api/track/view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      }).then(() => {
        sessionStorage.setItem(`tracked_job_${jobId}`, "true");
      }).catch(console.error);
    }
  }, [jobId]);

  return null;
}
