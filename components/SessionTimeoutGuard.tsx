"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Inactivity timeout limit: 15 minutes in milliseconds
const TIMEOUT_DURATION = 15 * 60 * 1000;

export default function SessionTimeoutGuard() {
  const router = useRouter();
  const supabase = createClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let activityCleanup: (() => void) | undefined;

    const setupInactivityTimer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // If there is no active session, we don't start the inactivity timer
      if (!user) return;

      const handleLogout = async () => {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error("Inactivity signout error:", err);
        }
        // Redirect to login page indicating a timeout
        router.push("/login?reason=timeout");
        router.refresh();
      };

      const resetTimer = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(handleLogout, TIMEOUT_DURATION);
      };

      // Set of standard client events that trigger activity reset
      const activityEvents = [
        "mousemove",
        "mousedown",
        "keydown",
        "scroll",
        "click",
        "touchstart",
      ];

      // Initialize the timer
      resetTimer();

      // Register event listeners
      activityEvents.forEach((event) => {
        window.addEventListener(event, resetTimer, { passive: true });
      });

      activityCleanup = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        activityEvents.forEach((event) => {
          window.removeEventListener(event, resetTimer);
        });
      };
    };

    setupInactivityTimer();

    // Subscribe to auth state changes to teardown timer if manually signed out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      } else if (event === "SIGNED_IN") {
        // Setup timer on sign in event
        setupInactivityTimer();
      }
    });

    return () => {
      if (activityCleanup) {
        activityCleanup();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return null;
}
