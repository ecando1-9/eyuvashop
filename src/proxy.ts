import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  const { supabase, response } = await createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isDeletedUser = user?.user_metadata?.is_deleted === true;

  // Protect account routes — redirect to /login
  if (pathname.startsWith('/account') && (!user || isDeletedUser)) {
    return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!user || isDeletedUser) {
      return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect merchant routes
  if (pathname.startsWith('/merchant') && (!user || isDeletedUser)) {
    return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(pathname), request.url));
  }

  // Redirect active logged-in users away from auth pages
  if (user && !isDeletedUser && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
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
