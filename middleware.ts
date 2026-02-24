import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
	const url = new URL(req.url);
	const token = req.cookies.get("token")?.value;
	if (!token) {
		url.pathname = "/auth/sign-in";
		return NextResponse.redirect(url);
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/dashboard/:path*", "/profile", "/settings"],
};
