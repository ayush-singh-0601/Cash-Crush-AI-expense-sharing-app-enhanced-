'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, PlusCircle, BookUser, User } from "lucide-react";
import { useStoreUser } from "@/hooks/use-store-user";

export default function BottomNav() {
  const path = usePathname();
  const { isLoading, isAuthenticated, userId } = useStoreUser();
  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home" },
    { href: "/groups", icon: Users, label: "Groups" },
    { href: "/expenses/new", icon: PlusCircle, label: "Add", isCenter: true },
    { href: "/contacts", icon: BookUser, label: "Contacts" },
  ];
  if (userId) {
    navItems.push({ href: `/person/${userId}`, icon: User, label: "Profile" });
  }
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-end justify-center">
      <div className="flex gap-2 px-4 py-2 glass shadow-2xl rounded-full backdrop-blur-xl border border-border">
        {navItems.map((item, idx) =>
          item.isCenter ? (
            <Link
              key={item.href}
              href={item.href}
              className="relative -mt-8 mx-2 flex flex-col items-center justify-center"
              aria-label={item.label}
            >
              <div className="premium-gradient rounded-full w-16 h-16 flex items-center justify-center shadow-xl border-4 border-white/80">
                <item.icon className="h-8 w-8" />
              </div>
              <span className="text-xs font-semibold mt-1 text-primary/80">{item.label}</span>
            </Link>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-4 py-2 rounded-full transition-all duration-200 ${path.startsWith(item.href) ? "bg-gradient-to-r from-green-100 to-blue-100 text-primary font-bold" : "text-muted-foreground hover:bg-muted/60"}`}
              aria-label={item.label}
            >
              <item.icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-semibold">{item.label}</span>
            </Link>
          )
        )}
      </div>
    </nav>
  );
} 