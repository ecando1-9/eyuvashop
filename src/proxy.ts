import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const { supabase, response } = await createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDeletedUser = user?.user_metadata?.is_deleted === true;

  // Helper to preserve refreshed cookies on redirects
  const redirectWithCookies = (targetPath: string) => {
    const redirectRes = NextResponse.redirect(new URL(targetPath, request.url));
    response.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c);
    });
    return redirectRes;
  };

  // Protect account routes — redirect to /login
  if (pathname.startsWith('/account') && (!user || isDeletedUser)) {
    return redirectWithCookies('/login?redirect=' + encodeURIComponent(pathname));
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!user || isDeletedUser) {
      return redirectWithCookies('/login?redirect=' + encodeURIComponent(pathname));
    }

    const isDirectAdmin = user.email === 'eyuvashop@gmail.com' || user.user_metadata?.role === 'admin';

    if (!isDirectAdmin) {
      try {
        // Fast DB check with safety timeout to prevent server hang / 10s timeout
        const rolePromise = supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const timeoutPromise = new Promise<{ data: any }>((resolve) =>
          setTimeout(() => resolve({ data: null }), 1500)
        );

        const { data: profile } = await Promise.race([rolePromise, timeoutPromise]);

        if (profile && profile.role !== 'admin') {
          return redirectWithCookies('/');
        }
      } catch {
        // Continue to page and allow useAuth hook on client to perform final check
      }
    }
  }

  // Protect merchant routes
  if (pathname.startsWith('/merchant') && (!user || isDeletedUser)) {
    return redirectWithCookies('/login?redirect=' + encodeURIComponent(pathname));
  }

  // Redirect active logged-in users away from auth pages
  if (user && !isDeletedUser && (pathname === '/login' || pathname === '/signup')) {
    return redirectWithCookies('/');
  }

  return response;
}

export const config = {
  matcher: [
    '/account/:path*',
    '/admin/:path*',
    '/merchant/:path*',
    '/login',
    '/signup',
    '/checkout',
  ],
};
