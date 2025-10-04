"use client";

import { Navbar } from "@/components/navbar";
import { usePathname } from "next/navigation";

export function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Don't show navbar on the create and my-posts pages
  if (pathname?.startsWith('/create') || pathname === '/my-posts') {
    return null;
  }
  
  return <Navbar />;
}