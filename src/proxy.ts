export { auth as proxy } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/notifications/:path*",
    "/projects/create",
  ],
};
