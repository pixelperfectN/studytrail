"use client";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const navigation = [
  {
    name: "Home",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    name: "Learn",
    href: "/learn",
    icon: "✦",
  },
  {
    name: "My Learning",
    href: "/my-learning",
    icon: "◷",
  },
  {
    name: "My Notes",
    href: "/my-notes",
    icon: "□",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.push("/auth/login");

    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}

      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-[#e5dadd] bg-[#fcfaf8] md:flex">

        <div className="flex h-20 items-center px-7">

          <Link
            href="/dashboard"
            className="text-xl font-semibold tracking-tight text-[#250e2c]"
          >
            Study
            <span className="text-[#837ab6]">
              Trail
            </span>
          </Link>

        </div>

        <nav className="flex-1 px-4 py-4">

          <p className="px-3 pb-3 text-xs font-medium uppercase tracking-wider text-[#9d85b6]">
            Workspace
          </p>

          <div className="space-y-1">

            {navigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[#f1e9f2] text-[#250e2c]"
                      : "text-[#6f6870] hover:bg-[#f7f2ee] hover:text-[#250e2c]"
                  }`}
                >

                  <span className="flex h-7 w-7 items-center justify-center text-base text-[#837ab6]">
                    {item.icon}
                  </span>

                  {item.name}

                </Link>
              );
            })}

          </div>

        </nav>

        <div className="border-t border-[#e5dadd] p-4">

          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#6f6870] transition hover:bg-[#f7f2ee] hover:text-[#250e2c]"
          >

            <span className="flex h-7 w-7 items-center justify-center text-[#837ab6]">
              ⚙
            </span>

            Settings

          </Link>

          <button
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#6f6870] transition hover:bg-[#f7f2ee] hover:text-[#cc8db3]"
          >

            <span className="flex h-7 w-7 items-center justify-center text-[#837ab6]">
              ↪
            </span>

            Log out

          </button>

        </div>

      </aside>

      {/* Mobile bottom navigation */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e5dadd] bg-[#fcfaf8]/95 px-2 py-2 backdrop-blur md:hidden">

        <div className="flex items-center justify-around">

          {navigation.slice(0, 4).map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium ${
                  active
                    ? "text-[#250e2c]"
                    : "text-[#9d85b6]"
                }`}
              >

                <span className="text-base">
                  {item.icon}
                </span>

                {item.name === "My Learning"
                  ? "Learning"
                  : item.name === "My Notes"
                    ? "Notes"
                    : item.name}

              </Link>
            );
          })}

        </div>

      </nav>
    </>
  );
}