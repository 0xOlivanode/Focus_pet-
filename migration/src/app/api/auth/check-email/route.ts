import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("auth_type")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ authType: "new" });
    }

    return NextResponse.json({ authType: data.auth_type });
  } catch (err) {
    console.error("[check-email]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
