import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");

  const type = request.nextUrl.searchParams.get("type");

  const redirectUrl = new URL("/login", request.url);

  if (!tokenHash || type !== "email") {
    redirectUrl.searchParams.set("error", "invalid_confirmation");
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.redirect(new URL("/app/dashboard", request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.redirect(
            new URL("/app/dashboard", request.url),
          );

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });

  if (error) {
    const failedUrl = new URL("/login", request.url);

    failedUrl.searchParams.set("error", "confirmation_failed");

    return NextResponse.redirect(failedUrl);
  }

  return response;
}
