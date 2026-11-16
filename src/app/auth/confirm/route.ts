import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (tokenHash && type === "email") {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });

    if (!error) {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation", request.url),
  );
}
