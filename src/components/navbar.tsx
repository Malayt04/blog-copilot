"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, User, LogOut, Plus, Bot } from "lucide-react";
import { useTheme } from "next-themes";
import { AIChatbot } from "@/components/ai-chatbot";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
            >
              Blog
            </Link>

            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {session ? (
                <div className="flex items-center space-x-4">
                  <Link href="/my-posts">
                    <Button variant="ghost">
                      My Posts
                    </Button>
                  </Link>
                  <Link href="/create">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Write
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/my-posts">My Posts</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        {session.user?.name || session.user?.email}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost">Sign in</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button>Sign up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* AI Chatbot */}
      <AIChatbot />
    </>
  );
}
