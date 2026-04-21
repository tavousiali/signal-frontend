// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token"); // نام کوکی توکن خود را اینجا بگذارید
  const { pathname } = request.nextUrl;

  // اگر مسیر درخواستی صفحه لاگین نیست و توکن هم وجود ندارد
  if (pathname !== "/signin" && !token) {
    // کاربر را به صفحه لاگین هدایت کن
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // اگر مسیر درخواستی صفحه لاگین است و توکن وجود دارد، یا اگر توکن وجود دارد
  // اجازه بده درخواست به مسیر اصلی خودش برود
  return NextResponse.next();
}

// تنظیمات matcher برای تعیین اینکه middleware روی کدام مسیرها اجرا شود
export const config = {
  // این تنظیمات به صورت پیشفرض روی همه مسیرها اجرا میشه
  // ولی باید دقت کنید که روی فایل‌های عمومی و استاتیک هم اجرا نشه
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images/*).*)",
  ],
};
