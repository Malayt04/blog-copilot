"use client";

import { Navbar } from "@/components/navbar";
import { usePathname } from "next/navigation";

export function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Don't show navbar on the create page
  if (pathname?.startsWith('/create')) {
    return null;
  }
  
  return <Navbar />;
}