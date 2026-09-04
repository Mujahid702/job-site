import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized login session required" }, { status: 401 });
    }

    // Fetch payments log
    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("payment_date", { ascending: false });

    if (payError) throw payError;

    // Fetch invoices log
    const { data: invoices, error: invError } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("issued_date", { ascending: false });

    if (invError) throw invError;

    return NextResponse.json({
      success: true,
      payments,
      invoices
    });
  } catch (err: any) {
    console.error("[Invoices API Route Error]:", err);
    return NextResponse.json({ success: false, message: err.message || "Failed to retrieve invoice logs" }, { status: 500 });
  }
}
