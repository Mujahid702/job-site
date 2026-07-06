"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { isFeatureVisible } from "@/lib/featureFlags";
import FeatureUnavailable from "@/components/FeatureUnavailable";

export default function CareerRoadmapManualPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function checkVisibility() {
      const { data: { user } } = await supabase.auth.getUser();
      const isVisible = isFeatureVisible("roadmap", user);
      setVisible(isVisible);
      if (isVisible) {
        router.replace("/dashboard?tab=roadmap");
      } else {
        setLoading(false);
      }
    }
    checkVisibility();
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">
            Verifying access permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!visible) {
    return <FeatureUnavailable />;
  }

  return null;
}
