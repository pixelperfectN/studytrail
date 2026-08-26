import { createClient } from "@/lib/supabase/server";

import { redirect } from "next/navigation";

import Sidebar from "@/components/dashboard/sidebar";

import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  const userId = data.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, university, branch, year")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  const firstName =
    profile.full_name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-[#f7f2ee] text-[#250e2c]">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 md:pb-0">

          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">

            {/* Greeting */}

            <section>

              <p className="text-sm font-medium text-[#837ab6]">
                Good to see you
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                What do you want to learn, {firstName}?
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-[#6f6870]">
                Understand difficult topics, ask follow-up questions,
                and turn your learning sessions into clear notes and
                quick revision material.
              </p>

            </section>

            {/* Quick actions */}

            <section className="mt-10">

              <div className="mb-4 flex items-end justify-between">

                <div>

                  <h2 className="text-lg font-semibold">
                    Start learning
                  </h2>

                  <p className="mt-1 text-sm text-[#9d85b6]">
                    Choose how you want to study today.
                  </p>

                </div>

              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <Link
                  href="/learn"
                  className="group rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6 transition hover:-translate-y-0.5 hover:border-[#cc8db3]/50 hover:shadow-md"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e9f2] text-xl text-[#837ab6]">
                    ✦
                  </div>

                  <h3 className="mt-5 font-semibold">
                    Learn a topic
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#6f6870]">
                    Get a clear explanation adapted to your branch,
                    year, and subject.
                  </p>

                  <span className="mt-5 inline-block text-sm font-medium text-[#250e2c]">
                    Start learning →
                  </span>

                </Link>

                <Link
                  href="/my-notes"
                  className="group rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6 transition hover:-translate-y-0.5 hover:border-[#cc8db3]/50 hover:shadow-md"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e9f2] text-xl text-[#837ab6]">
                    ↑
                  </div>

                  <h3 className="mt-5 font-semibold">
                    Upload your notes
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#6f6870]">
                    Upload your study material and later ask AI
                    questions directly from it.
                  </p>

                  <span className="mt-5 inline-block text-sm font-medium text-[#250e2c]">
                    Upload material →
                  </span>

                </Link>

                <Link
                  href="/my-learning"
                  className="group rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6 transition hover:-translate-y-0.5 hover:border-[#cc8db3]/50 hover:shadow-md"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1e9f2] text-xl text-[#9d85b6]">
                    ◷
                  </div>

                  <h3 className="mt-5 font-semibold">
                    Continue learning
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#6f6870]">
                    Revisit topics and saved learning sessions from
                    your previous study.
                  </p>

                  <span className="mt-5 inline-block text-sm font-medium text-[#250e2c]">
                    View learning →
                  </span>

                </Link>

              </div>

            </section>

          </div>

        </main>
      </div>
    </div>
  );
}

function ActivityCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-5">

      <p className="text-sm text-[#6f6870]">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {value}
      </p>

    </div>
  );
}