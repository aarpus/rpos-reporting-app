import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((request) => {
  if (!request.auth?.user) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/auth", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth(?:/|$)|auth(?:/|$)|_next/|images/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
