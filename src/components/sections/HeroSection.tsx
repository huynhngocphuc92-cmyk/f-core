import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50 -z-10" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-200/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1.5 text-sm font-medium text-cyan-700 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              New: AI-powered features now available
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Grow better with{" "}
              <span className="text-[#0891b2]">F-CORE</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
              Software that&apos;s powerful, not overpowering. Seamlessly connect your data,
              teams, and customers on one AI-powered customer platform that grows with your business.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="#"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0891b2] px-6 py-3 text-base font-semibold text-white hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-cyan-500/25"
              >
                Get started free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <Play className="h-5 w-5 text-[#0891b2]" />
                Watch demo
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 pt-10 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Trusted by over 228,000+ customers worldwide
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-60">
                {["Atlassian", "DoorDash", "Eventbrite", "SurveyMonkey", "Trello"].map(
                  (company) => (
                    <span
                      key={company}
                      className="text-lg font-semibold text-gray-400"
                    >
                      {company}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right content - Dashboard preview */}
          <div className="relative lg:ml-8">
            <div className="relative rounded-2xl bg-white shadow-2xl shadow-gray-900/10 border border-gray-200 overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-gray-200 rounded-md max-w-xs" />
                </div>
              </div>

              {/* Dashboard content placeholder */}
              <div className="p-6 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Contacts", value: "12,847" },
                    { label: "Deals", value: "$2.4M" },
                    { label: "Tasks", value: "156" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-lg bg-gray-50 text-center"
                    >
                      <div className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Chart placeholder */}
                <div className="h-48 bg-gradient-to-t from-cyan-100 to-transparent rounded-lg flex items-end justify-around p-4">
                  {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                    <div
                      key={i}
                      className="w-8 bg-[#0891b2] rounded-t-md"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                {/* Recent activity */}
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-2 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Deal closed!</div>
                  <div className="text-xs text-gray-500">$24,500</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">New lead</div>
                  <div className="text-xs text-gray-500">Just now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
