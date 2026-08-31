"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    number: "01",
    title: "Choose Your Topic",
    description:
      "Select your branch, academic year, subject, and topic to start learning what you actually need.",
    icon: "◎",
  },
  {
    number: "02",
    title: "AI-Generated Notes",
    description:
      "Generate structured notes for the topic you're studying, with clear explanations and important points.",
    icon: "✦",
  },
  {
    number: "03",
    title: "AI Explanations",
    description:
      "Understand difficult academic concepts with explanations designed to be easier to follow.",
    icon: "◌",
  },
  {
    number: "04",
    title: "Ask AI",
    description:
      "Ask follow-up questions whenever you get stuck and continue the conversation until it makes sense.",
    icon: "↗",
  },
  {
    number: "05",
    title: "Upload Your Notes",
    description:
      "Upload your study material and ask questions based directly on the notes you're studying from.",
    icon: "↑",
  },
  {
    number: "06",
    title: "My Learning",
    description:
      "Revisit your previous learning sessions and continue exploring the topics you've already studied.",
    icon: "↻",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose",
    description:
      "Select your branch, year, subject, and topic.",
  },
  {
    number: "02",
    title: "Build Context",
    description:
      "StudyTrail uses relevant academic information and your uploaded material when available.",
  },
  {
    number: "03",
    title: "Learn",
    description:
      "Get clear explanations, structured notes, examples, and important concepts.",
  },
  {
    number: "04",
    title: "Ask",
    description:
      "Ask follow-up questions whenever something needs more explanation.",
  },
  {
    number: "05",
    title: "Save",
    description:
      "Return to your previous learning sessions whenever you want.",
  },
];

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M4 10h11M10.5 5.5 15 10l-4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M12 2.8c.5 5.3 3.1 8 8.4 8.5-5.3.5-7.9 3.2-8.4 8.5-.5-5.3-3.1-8-8.4-8.5 5.3-.5 7.9-3.2 8.4-8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v12.5H7.5A2.5 2.5 0 0 0 5 22V4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5 19.5c0-1.1.9-2 2-2h12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4.2A2.5 2.5 0 0 1 5 13.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        visible
          ? "translate-y-0 opacity-100 blur-0"
          : "translate-y-8 opacity-0 blur-[4px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

function ProductPreview() {
  const [mouse, setMouse] = useState({
    x: 50,
    y: 50,
  });

  return (
    <div
      onMouseMove={(e) => {
        const rect =
          e.currentTarget.getBoundingClientRect();

        setMouse({
          x:
            ((e.clientX - rect.left) /
              rect.width) *
            100,
          y:
            ((e.clientY - rect.top) /
              rect.height) *
            100,
        });
      }}
      className="group relative mx-auto max-w-5xl"
    >
      <div
        className="pointer-events-none absolute -inset-16 opacity-70 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(246,165,192,0.42), rgba(131,122,182,0.25) 35%, transparent 68%)`,
        }}
      />

      <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-[#fcfaf8]/95 shadow-[0_35px_100px_rgba(37,14,44,0.15)] backdrop-blur-xl transition-transform duration-500 group-hover:-translate-y-1">

        {/* Browser bar */}

        <div className="flex h-11 items-center border-b border-[#e5dadd] bg-white/70 px-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#cc8db3]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#9d85b6]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#837ab6]" />
          </div>

          <div className="mx-auto hidden rounded-lg border border-[#e5dadd] bg-[#f7f2ee] px-20 py-1.5 text-[10px] text-[#837ab6] sm:block">
            StudyTrail
          </div>
        </div>

        <div className="grid min-h-[430px] lg:grid-cols-[190px_1fr]">

          {/* Sidebar */}

          <div className="hidden border-r border-[#e5dadd] bg-[#f7f2ee] p-5 lg:block">

            <div className="text-sm font-semibold text-[#250e2c]">
              Study
              <span className="text-[#837ab6]">
                Trail
              </span>
            </div>

            <div className="mt-8 space-y-2">
              <div className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#250e2c] shadow-sm">
                Home
              </div>

              <div className="px-3 py-2 text-xs text-[#837ab6]">
                Learn
              </div>

              <div className="px-3 py-2 text-xs text-[#9d85b6]">
                My Learning
              </div>

              <div className="px-3 py-2 text-xs text-[#9d85b6]">
                My Notes
              </div>
            </div>

          </div>

          {/* Main */}

          <div className="bg-[#f7f2ee] p-5 sm:p-8">

            <div className="mb-7">
              <p className="text-xs font-medium uppercase tracking-wider text-[#837ab6]">
                Learn a topic
              </p>

              <h3 className="mt-1 text-xl font-semibold text-[#250e2c]">
                What do you want to learn?
              </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">

              <div className="rounded-xl border border-[#e5dadd] bg-[#fcfaf8] p-4">
                <p className="text-[11px] text-[#9d85b6]">
                  Branch
                </p>

                <p className="mt-1 text-sm font-medium text-[#302534]">
                  Computer Science &
                  Engineering
                </p>
              </div>

              <div className="rounded-xl border border-[#e5dadd] bg-[#fcfaf8] p-4">
                <p className="text-[11px] text-[#9d85b6]">
                  Academic year
                </p>

                <p className="mt-1 text-sm font-medium text-[#302534]">
                  3rd Year
                </p>
              </div>

              <div className="rounded-xl border border-[#e5dadd] bg-[#fcfaf8] p-4">
                <p className="text-[11px] text-[#9d85b6]">
                  Subject
                </p>

                <p className="mt-1 text-sm font-medium text-[#302534]">
                  Database Management
                  Systems
                </p>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-[#cc8db3]/40 bg-gradient-to-br from-[#f1e9f2] via-[#f9edf1] to-[#f7c2ca]/60 p-4">

                <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-[#f6a5c0]/40 blur-2xl" />

                <p className="relative text-[11px] text-[#837ab6]">
                  Topic
                </p>

                <p className="relative mt-1 text-sm font-medium text-[#250e2c]">
                  Normalization
                </p>
              </div>

            </div>

            <div className="mt-6 rounded-xl border border-[#e5dadd] bg-[#fcfaf8] p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs font-medium text-[#837ab6]">
                    AI-generated learning
                  </p>

                  <h4 className="mt-1 font-semibold text-[#250e2c]">
                    Normalization
                  </h4>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#837ab6] to-[#cc8db3] text-white shadow-sm">
                  <SparkIcon />
                </div>

              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">

                <div>
                  <p className="text-xs font-semibold text-[#250e2c]">
                    Definition
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#6f6870]">
                    Organizing data to reduce
                    redundancy and improve
                    data integrity.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#250e2c]">
                    Key Concepts
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#6f6870]">
                    1NF · 2NF · 3NF ·
                    Dependencies
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#250e2c]">
                    Important
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#6f6870]">
                    Reduce duplication while
                    preserving relationships.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating card */}

      <div className="absolute -right-4 top-16 hidden w-44 animate-[float_5s_ease-in-out_infinite] rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl lg:block">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f7c2ca] text-[#250e2c]">
            <SparkIcon />
          </div>

          <div>
            <p className="text-[10px] text-[#9d85b6]">
              StudyTrail
            </p>

            <p className="text-xs font-semibold text-[#250e2c]">
              Ready to learn
            </p>
          </div>
        </div>
      </div>

      <div className="absolute -left-5 bottom-12 hidden w-48 animate-[float_6s_ease-in-out_infinite_reverse] rounded-2xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl lg:block">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#9d85b6]">
          Your topic
        </p>

        <p className="mt-1 text-sm font-semibold text-[#250e2c]">
          Normalization
        </p>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f1e9f2]">
          <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#837ab6] to-[#f6a5c0]" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [scrolled, setScrolled] =
    useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }

    handleScroll();

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f2ee] text-[#250e2c]">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-[#e5dadd] bg-[#f7f2ee]/90 shadow-sm backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-[#250e2c]"
          >
            Study
            <span className="text-[#837ab6]">
              Trail
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">

            <a
              href="#how-it-works"
              className="text-sm text-[#6f6870] transition hover:text-[#250e2c]"
            >
              How It Works
            </a>

            <a
              href="#features"
              className="text-sm text-[#6f6870] transition hover:text-[#250e2c]"
            >
              Features
            </a>

            <a
              href="#about"
              className="text-sm text-[#6f6870] transition hover:text-[#250e2c]"
            >
              About
            </a>

            <Link
              href="/auth/login"
              className="text-sm font-medium text-[#6f6870] transition hover:text-[#250e2c]"
            >
              Login
            </Link>

            <Link
              href="/auth/signup"
              className="rounded-xl bg-[#250e2c] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#3b1b43]"
            >
              Sign up
            </Link>

          </nav>

          <button
            type="button"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5dadd] bg-[#fcfaf8] text-[#250e2c] md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? "×" : "☰"}
          </button>

        </div>

        {menuOpen && (
          <div className="border-t border-[#e5dadd] bg-[#fcfaf8] px-5 py-5 md:hidden">

            <nav className="flex flex-col gap-1">

              <a
                href="#how-it-works"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm text-[#6f6870] hover:bg-[#f7f2ee]"
              >
                How It Works
              </a>

              <a
                href="#features"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm text-[#6f6870] hover:bg-[#f7f2ee]"
              >
                Features
              </a>

              <a
                href="#about"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm text-[#6f6870] hover:bg-[#f7f2ee]"
              >
                About
              </a>

              <Link
                href="/auth/login"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="rounded-xl px-4 py-3 text-sm text-[#6f6870] hover:bg-[#f7f2ee]"
              >
                Login
              </Link>

              <Link
                href="/auth/signup"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="mt-2 rounded-xl bg-[#250e2c] px-4 py-3 text-center text-sm font-medium text-white"
              >
                Sign up
              </Link>

            </nav>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden px-5 pb-24 pt-36 sm:px-8 sm:pt-44 lg:px-10 lg:pb-32">

        {/* Animated gradient atmosphere */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute left-1/2 top-[-280px] h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#837ab6]/30 via-[#cc8db3]/25 to-[#f6a5c0]/30 blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />

          <div className="absolute left-[10%] top-[30%] h-56 w-56 rounded-full bg-[#837ab6]/15 blur-3xl animate-[float_8s_ease-in-out_infinite]" />

          <div className="absolute right-[5%] top-[45%] h-64 w-64 rounded-full bg-[#f6a5c0]/20 blur-3xl animate-[float_9s_ease-in-out_infinite_reverse]" />

        </div>

        <div className="relative mx-auto max-w-7xl">

          <div className="mx-auto max-w-4xl text-center">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#e5dadd] bg-white/70 px-3.5 py-2 text-xs font-medium text-[#837ab6] shadow-sm backdrop-blur-xl animate-[fadeIn_0.8s_ease-out]">
              <SparkIcon />
              AI-powered learning for students
            </div>

            <h1 className="text-balance text-5xl font-semibold leading-[1.03] tracking-[-0.045em] text-[#250e2c] sm:text-6xl lg:text-8xl">

              <span className="inline-block animate-[heroWord_0.9s_ease-out]">
                Learn Smarter.
              </span>

              <br />

              <span className="inline-block bg-gradient-to-r from-[#837ab6] via-[#cc8db3] to-[#f6a5c0] bg-clip-text text-transparent animate-[heroWord_1.1s_ease-out]">
                Understand Better.
              </span>

            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-[#6f6870] sm:text-lg sm:leading-8 animate-[fadeIn_1.2s_ease-out]">
              StudyTrail turns your syllabus and
              study material into simple,
              personalized explanations and
              notes — powered by AI and built
              for students.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-[fadeIn_1.4s_ease-out]">

              <Link
                href="/auth/signup"
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#250e2c] px-6 text-sm font-medium text-white shadow-[0_10px_30px_rgba(37,14,44,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(131,122,182,0.25)] sm:w-auto"
              >
                Start Learning
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowIcon />
                </span>
              </Link>

              <a
                href="#features"
                className="flex h-12 w-full items-center justify-center rounded-xl border border-[#e5dadd] bg-white/70 px-6 text-sm font-medium text-[#250e2c] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#cc8db3]/50 hover:bg-white sm:w-auto"
              >
                Explore StudyTrail
              </a>

            </div>

          </div>

          <div className="relative mx-auto mt-20 sm:mt-24">
            <ProductPreview />
          </div>

        </div>
      </section>

      {/* =====================================================
          VALUE STRIP
      ====================================================== */}

      <section className="border-y border-[#e5dadd] bg-[#fcfaf8] px-5 py-8 sm:px-8 lg:px-10">

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 sm:grid-cols-4">

          {[
            "Syllabus-focused",
            "AI-powered",
            "Personalized",
            "Easy to understand",
          ].map((item, index) => (
            <Reveal key={item}>

              <div className="flex items-center justify-center gap-2 text-center text-sm font-medium text-[#6f6870]">

                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    index % 2 === 0
                      ? "bg-[#837ab6]"
                      : "bg-[#cc8db3]"
                  }`}
                />

                {item}

              </div>

            </Reveal>
          ))}

        </div>
      </section>

      {/* =====================================================
          PROBLEM / SOLUTION
      ====================================================== */}

      <section
        id="about"
        className="px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
      >
        <div className="mx-auto max-w-6xl">

          <Reveal>
            <div className="max-w-2xl">

              <p className="text-sm font-medium text-[#837ab6]">
                The problem
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#250e2c] sm:text-5xl">
                Studying shouldn&apos;t feel
                this complicated.
              </h2>

              <p className="mt-5 text-base leading-7 text-[#6f6870]">
                College students often spend more
                time finding and organizing
                information than actually
                understanding it.
              </p>

            </div>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {[
              {
                title: "Scattered Resources",
                text: "Information is spread across websites, PDFs, videos, and notes.",
              },
              {
                title: "Difficult Explanations",
                text: "Concepts are often explained in ways that are hard to follow.",
              },
              {
                title: "Making Notes Takes Time",
                text: "Students spend hours organizing information before they can revise it.",
              },
              {
                title: "Finding What Matters",
                text: "Finding information relevant to your actual syllabus can be frustrating.",
              },
            ].map((item, index) => (
              <Reveal
                key={item.title}
                className={`delay-${index * 100}`}
              >

                <div className="group h-full rounded-2xl border border-[#e5dadd] bg-[#fcfaf8] p-6 transition duration-300 hover:-translate-y-2 hover:border-[#cc8db3]/40 hover:shadow-[0_20px_50px_rgba(37,14,44,0.08)]">

                  <span className="text-xs font-medium text-[#9d85b6]">
                    0{index + 1}
                  </span>

                  <h3 className="mt-10 text-lg font-semibold text-[#250e2c]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#6f6870]">
                    {item.text}
                  </p>

                  <div className="mt-7 h-px w-8 bg-gradient-to-r from-[#837ab6] to-[#f6a5c0] transition-all duration-500 group-hover:w-16" />

                </div>

              </Reveal>
            ))}

          </div>

          <Reveal>
            <div className="relative mt-20 overflow-hidden rounded-2xl border border-[#e5dadd] bg-gradient-to-br from-[#f1e9f2] via-[#f9edf1] to-[#f7c2ca]/60 p-8 sm:p-12">

              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#f6a5c0]/30 blur-3xl" />

              <div className="relative grid items-center gap-10 lg:grid-cols-2">

                <div>

                  <p className="text-sm font-medium text-[#837ab6]">
                    The StudyTrail approach
                  </p>

                  <h3 className="mt-3 text-3xl font-semibold tracking-tight text-[#250e2c]">
                    StudyTrail brings
                    everything together.
                  </h3>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-[#6f6870]">
                    Start with the topic you actually
                    need to understand and learn
                    through one focused experience.
                  </p>

                </div>

                <div className="rounded-xl border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">

                  <div className="space-y-3 text-sm">

                    <div className="rounded-lg bg-[#f7f2ee] px-4 py-3 text-[#9d85b6] line-through">
                      Search → Open tabs → Read
                    </div>

                    <div className="rounded-lg bg-[#f7f2ee] px-4 py-3 text-[#9d85b6] line-through">
                      Get confused → Make notes
                    </div>

                    <div className="flex items-center justify-center py-1 text-[#cc8db3]">
                      ↓
                    </div>

                    <div className="rounded-lg bg-gradient-to-r from-[#837ab6] via-[#9d85b6] to-[#cc8db3] px-4 py-3 font-medium text-white shadow-sm">
                      Choose → Learn → Ask →
                      Understand → Save
                    </div>

                  </div>

                </div>

              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* =====================================================
          FEATURES
      ====================================================== */}

      <section
        id="features"
        className="relative overflow-hidden bg-[#fcfaf8] px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
      >

        <div className="pointer-events-none absolute left-[-150px] top-[20%] h-80 w-80 rounded-full bg-[#837ab6]/10 blur-3xl" />

        <div className="pointer-events-none absolute right-[-150px] bottom-[10%] h-80 w-80 rounded-full bg-[#f6a5c0]/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">

          <Reveal>

            <div className="max-w-2xl">

              <p className="text-sm font-medium text-[#837ab6]">
                What you can do
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#250e2c] sm:text-5xl">
                Everything you need to
                learn better.
              </h2>

              <p className="mt-5 text-base leading-7 text-[#6f6870]">
                One learning workspace for
                understanding concepts, creating
                notes, asking questions, and
                studying from your own material.
              </p>

            </div>

          </Reveal>

          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {features.map((feature, index) => (
              <Reveal key={feature.number}>

                <div className="group relative h-full overflow-hidden rounded-2xl border border-[#e5dadd] bg-white p-7 transition duration-500 hover:-translate-y-2 hover:border-[#cc8db3]/50 hover:shadow-[0_25px_60px_rgba(37,14,44,0.08)]">

                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#f6a5c0]/0 blur-2xl transition duration-500 group-hover:bg-[#f6a5c0]/30" />

                  <div className="relative flex items-center justify-between">

                    <span className="text-xs font-medium text-[#9d85b6]">
                      {feature.number}
                    </span>

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f1e9f2] to-[#f7c2ca]/60 text-lg text-[#837ab6] transition duration-300 group-hover:scale-110 group-hover:text-[#250e2c]">
                      {feature.icon}
                    </span>

                  </div>

                  <h3 className="relative mt-10 text-lg font-semibold text-[#250e2c]">
                    {feature.title}
                  </h3>

                  <p className="relative mt-3 text-sm leading-6 text-[#6f6870]">
                    {feature.description}
                  </p>

                  <div className="relative mt-7 h-1 w-8 overflow-hidden rounded-full bg-[#f1e9f2]">
                    <div className="h-full w-full -translate-x-full rounded-full bg-gradient-to-r from-[#837ab6] via-[#cc8db3] to-[#f6a5c0] transition-transform duration-500 group-hover:translate-x-0" />
                  </div>

                </div>

              </Reveal>
            ))}

          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section
        id="how-it-works"
        className="relative overflow-hidden px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
      >

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#837ab6]/8 via-[#cc8db3]/10 to-[#f6a5c0]/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">

          <Reveal>

            <div className="text-center">

              <p className="text-sm font-medium text-[#837ab6]">
                How it works
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#250e2c] sm:text-5xl">
                From syllabus to
                understanding.
              </h2>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#6f6870]">
                A simple learning flow designed
                around how students actually study.
              </p>

            </div>

          </Reveal>

          <div className="relative mt-16">

            <div className="absolute left-[10%] right-[10%] top-8 hidden h-[2px] overflow-hidden rounded-full bg-[#e5dadd] lg:block">

              <div className="h-full w-full bg-gradient-to-r from-[#837ab6] via-[#cc8db3] to-[#f6a5c0] opacity-70" />

            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">

              {steps.map((step, index) => (
                <Reveal key={step.number}>

                  <div className="group relative text-center">

                    <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#e5dadd] bg-[#fcfaf8] text-sm font-semibold text-[#250e2c] shadow-sm transition duration-500 group-hover:scale-110 group-hover:border-[#cc8db3] group-hover:shadow-[0_10px_30px_rgba(204,141,179,0.2)]">

                      <span className="bg-gradient-to-r from-[#837ab6] to-[#cc8db3] bg-clip-text text-transparent">
                        {step.number}
                      </span>

                    </div>

                    <h3 className="mt-6 text-base font-semibold text-[#250e2c]">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[#6f6870]">
                      {step.description}
                    </p>

                  </div>

                </Reveal>
              ))}

            </div>
          </div>

          <Reveal>

            <div className="relative mt-20 overflow-hidden rounded-2xl border border-[#e5dadd] bg-white shadow-[0_25px_70px_rgba(37,14,44,0.08)]">

              <div className="absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-[#f6a5c0]/20 blur-3xl" />

              <div className="relative border-b border-[#e5dadd] px-6 py-4">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#837ab6] to-[#f6a5c0]" />

                  <span className="text-xs font-medium text-[#6f6870]">
                    StudyTrail learning flow
                  </span>

                </div>

              </div>

              <div className="grid lg:grid-cols-[1fr_1.2fr]">

                <div className="bg-[#f7f2ee] p-7 sm:p-10">

                  <p className="text-xs font-medium uppercase tracking-wider text-[#9d85b6]">
                    Your context
                  </p>

                  <div className="mt-6 space-y-3">

                    <div className="rounded-xl border border-[#e5dadd] bg-[#fcfaf8] p-4">
                      <p className="text-[11px] text-[#9d85b6]">
                        Branch
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#250e2c]">
                        Computer Science &
                        Engineering
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#e5dadd] bg-[#fcfaf8] p-4">
                      <p className="text-[11px] text-[#9d85b6]">
                        Subject
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#250e2c]">
                        Database Management
                        Systems
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#cc8db3]/40 bg-gradient-to-br from-[#f1e9f2] to-[#f7c2ca]/50 p-4">

                      <p className="text-[11px] text-[#837ab6]">
                        Topic
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#250e2c]">
                        Normalization
                      </p>

                    </div>

                  </div>
                </div>

                <div className="p-7 sm:p-10">

                  <div className="flex items-start justify-between">

                    <div>

                      <p className="text-xs font-medium text-[#837ab6]">
                        StudyTrail
                      </p>

                      <h3 className="mt-1 text-2xl font-semibold text-[#250e2c]">
                        Understanding your topic
                      </h3>

                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#837ab6] to-[#cc8db3] text-white shadow-sm">
                      <SparkIcon />
                    </div>

                  </div>

                  <div className="mt-8 space-y-5">

                    <div>
                      <p className="text-sm font-semibold text-[#250e2c]">
                        Definition
                      </p>

                      <p className="mt-2 text-sm leading-6 text-[#6f6870]">
                        Normalization is the process
                        of organizing data in a
                        database to reduce redundancy
                        and improve data integrity.
                      </p>
                    </div>

                    <div>

                      <p className="text-sm font-semibold text-[#250e2c]">
                        Key Concepts
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">

                        {[
                          "1NF",
                          "2NF",
                          "3NF",
                          "Functional Dependencies",
                        ].map((item) => (
                          <span
                            key={item}
                            className="rounded-lg bg-gradient-to-r from-[#f1e9f2] to-[#f7c2ca]/50 px-3 py-2 text-xs text-[#6f6870]"
                          >
                            {item}
                          </span>
                        ))}

                      </div>

                    </div>

                    <div className="rounded-xl bg-gradient-to-r from-[#f1e9f2] to-[#f9edf1] p-4">

                      <p className="text-xs font-semibold text-[#250e2c]">
                        Important point
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#6f6870]">
                        Good normalization reduces
                        duplication without losing
                        meaningful relationships.
                      </p>

                    </div>

                  </div>
                </div>

              </div>
            </div>

          </Reveal>

        </div>
      </section>

      {/* =====================================================
          UPLOAD NOTES
      ====================================================== */}

      <section className="relative overflow-hidden bg-[#fcfaf8] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">

        <div className="absolute left-[-100px] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#cc8db3]/15 blur-3xl" />

        <div className="absolute right-[-100px] top-1/3 h-72 w-72 rounded-full bg-[#837ab6]/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">

          <div className="grid items-center gap-12 lg:grid-cols-2">

            <Reveal>

              <div>

                <p className="text-sm font-medium text-[#837ab6]">
                  Your material. Your context.
                </p>

                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#250e2c] sm:text-5xl">
                  Bring your own notes
                  into the conversation.
                </h2>

                <p className="mt-5 max-w-xl text-base leading-7 text-[#6f6870]">
                  Upload your study material and
                  ask questions based on what you
                  actually need to learn.
                </p>

                <div className="mt-8">

                  <Link
                    href="/auth/signup"
                    className="group inline-flex items-center gap-2 rounded-xl bg-[#250e2c] px-5 py-3 text-sm font-medium text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-[#3b1b43]"
                  >
                    Start Learning

                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowIcon />
                    </span>

                  </Link>

                </div>

              </div>

            </Reveal>

            <Reveal>

              <div className="relative">

                <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-[#837ab6]/20 via-[#cc8db3]/20 to-[#f6a5c0]/25 blur-3xl" />

                <div className="group relative rounded-2xl border border-[#e5dadd] bg-white p-5 shadow-[0_25px_70px_rgba(37,14,44,0.1)] transition duration-500 hover:-translate-y-2 sm:p-7">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-xs font-medium text-[#837ab6]">
                        Uploaded Notes
                      </p>

                      <h3 className="mt-1 text-lg font-semibold text-[#250e2c]">
                        Operating System
                        Concepts
                      </h3>

                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f1e9f2] to-[#f7c2ca]/60 text-[#837ab6]">
                      <BookIcon />
                    </div>

                  </div>

                  <div className="mt-7 rounded-xl border border-[#e5dadd] bg-[#f7f2ee] p-5">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-sm font-medium text-[#250e2c]">
                          Unit-2.pdf
                        </p>

                        <p className="mt-1 text-xs text-[#9d85b6]">
                          Your uploaded study material
                        </p>

                      </div>

                      <span className="rounded-lg bg-gradient-to-r from-[#f1e9f2] to-[#f7c2ca]/60 px-2.5 py-1 text-[10px] font-medium text-[#837ab6]">
                        Ready
                      </span>

                    </div>

                    <div className="mt-5 border-t border-[#e5dadd] pt-5">

                      <p className="text-xs font-medium text-[#9d85b6]">
                        Ask AI about your notes
                      </p>

                      <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#e5dadd] bg-white px-4 py-3">

                        <span className="flex-1 text-xs text-[#9d85b6]">
                          What are threads?
                        </span>

                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#250e2c] text-white">
                          <ArrowIcon />
                        </span>

                      </div>

                    </div>

                  </div>

                </div>
              </div>

            </Reveal>

          </div>

        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="relative overflow-hidden px-5 py-28 sm:px-8 sm:py-36 lg:px-10">

        <div className="absolute inset-0 bg-gradient-to-br from-[#250e2c] via-[#837ab6] to-[#cc8db3]" />

        <div className="absolute inset-0 bg-gradient-to-tr from-[#250e2c]/30 via-transparent to-[#f6a5c0]/35" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f6a5c0]/20 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />

        <div className="relative mx-auto max-w-3xl text-center text-white">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white shadow-sm backdrop-blur-xl">
            <SparkIcon />
          </div>

          <h2 className="mt-7 text-4xl font-semibold tracking-tight sm:text-6xl">
            Ready to study smarter?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/75">
            Your next topic is just a
            conversation away.
          </p>

          <div className="mt-8">

            <Link
              href="/auth/signup"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-sm font-medium text-[#250e2c] shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-[#fff8fb]"
            >
              Start Learning

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowIcon />
              </span>

            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-[#e5dadd] bg-[#250e2c] px-5 py-10 text-white sm:px-8 lg:px-10">

        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <Link
              href="/"
              className="text-lg font-semibold tracking-tight"
            >
              Study
              <span className="text-[#f6a5c0]">
                Trail
              </span>
            </Link>

            <p className="mt-2 text-sm text-white/55">
              AI-powered learning, built for
              students.
            </p>

          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/55">

            <a
              href="#about"
              className="transition hover:text-white"
            >
              About
            </a>

            <a
              href="#how-it-works"
              className="transition hover:text-white"
            >
              How It Works
            </a>

            <a
              href="#features"
              className="transition hover:text-white"
            >
              Features
            </a>

            <Link
              href="/auth/login"
              className="transition hover:text-white"
            >
              Login
            </Link>

            <Link
              href="/auth/signup"
              className="transition hover:text-white"
            >
              Sign up
            </Link>

          </div>

        </div>

        <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6">

          <p className="text-xs text-white/35">
            © 2026 StudyTrail. All rights reserved.
          </p>

        </div>

      </footer>

      {/* =====================================================
          ANIMATION KEYFRAMES
      ====================================================== */}

      <style>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes heroWord {
          0% {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(10px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.7;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }
      `}</style>

    </main>
  );
}