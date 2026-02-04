"use client";

import { useState } from "react";

const products = [
  {
    id: "marketing",
    name: "Marketing Hub",
    tagline: "Marketing software",
    color: "#0891b2",
    description:
      "Marketing software to help you grow traffic, convert more visitors, and run complete inbound marketing campaigns at scale.",
    features: [
      "Lead generation",
      "Marketing automation",
      "Analytics",
      "Email marketing",
      "Social media",
      "SEO tools",
    ],
  },
  {
    id: "sales",
    name: "Sales Hub",
    tagline: "Sales CRM software",
    color: "#00bda5",
    description:
      "Sales CRM software to help you get deeper insights into prospects, automate tasks, and close more deals faster.",
    features: [
      "Email tracking",
      "Meeting scheduler",
      "Deal pipeline",
      "Sales automation",
      "Calling",
      "Playbooks",
    ],
  },
  {
    id: "service",
    name: "Service Hub",
    tagline: "Customer service software",
    color: "#6a78d1",
    description:
      "Customer service software to help you connect with customers, exceed expectations, and turn them into promoters.",
    features: [
      "Tickets",
      "Customer feedback",
      "Knowledge base",
      "Live chat",
      "Conversational bots",
      "Help desk",
    ],
  },
  {
    id: "cms",
    name: "CMS Hub",
    tagline: "Content management software",
    color: "#f5c26b",
    description:
      "Content management software that's flexible for marketers, powerful for developers, and gives customers a personalized experience.",
    features: [
      "Drag-and-drop editor",
      "SEO recommendations",
      "Website themes",
      "Multi-language content",
      "Adaptive testing",
      "Contact attribution",
    ],
  },
  {
    id: "operations",
    name: "Operations Hub",
    tagline: "Operations software",
    color: "#00a4bd",
    description:
      "Operations software that syncs your apps, cleans customer data, and automates processes for a friction-free business.",
    features: [
      "Data sync",
      "Programmable automation",
      "Data quality tools",
      "Workflow extensions",
      "Data sets",
      "Custom properties",
    ],
  },
];

export default function ProductsSection() {
  const [activeProduct, setActiveProduct] = useState(products[0]);

  return (
    <section className="py-20 lg:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            The customer platform
          </h2>
          <p className="text-lg text-gray-600">
            F-CORE&apos;s customer platform has all the tools and integrations you need
            for marketing, sales, content management, and customer service.
          </p>
        </div>

        {/* Products tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => setActiveProduct(product)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeProduct.id === product.id
                  ? "text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
              style={{
                backgroundColor:
                  activeProduct.id === product.id ? product.color : undefined,
              }}
            >
              {product.name}
            </button>
          ))}
        </div>

        {/* Active product content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Product info */}
          <div>
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white mb-4"
              style={{ backgroundColor: activeProduct.color }}
            >
              {activeProduct.tagline}
            </div>

            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {activeProduct.name}
            </h3>

            <p className="text-lg text-gray-600 mb-8">
              {activeProduct.description}
            </p>

            {/* Features list */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {activeProduct.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: activeProduct.color }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <a
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md text-white font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: activeProduct.color }}
              >
                Get started free
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Get a demo
              </a>
            </div>
          </div>

          {/* Right - Product visual */}
          <div className="relative">
            <div
              className="rounded-2xl p-8 transition-colors duration-300"
              style={{ backgroundColor: `${activeProduct.color}15` }}
            >
              {/* Mock product interface */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header bar */}
                <div
                  className="h-12 flex items-center px-4 gap-2"
                  style={{ backgroundColor: activeProduct.color }}
                >
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                    <div className="w-3 h-3 rounded-full bg-white/30" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-5 bg-white/20 rounded max-w-[200px]" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="text-center p-3 rounded-lg bg-gray-50">
                        <div
                          className="text-2xl font-bold"
                          style={{ color: activeProduct.color }}
                        >
                          {i * 42}%
                        </div>
                        <div className="text-xs text-gray-500">Metric {i}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart bars */}
                  <div className="h-32 flex items-end justify-around gap-2 p-4 bg-gray-50 rounded-lg">
                    {[60, 80, 45, 90, 70, 85, 55].map((h, i) => (
                      <div
                        key={i}
                        className="w-6 rounded-t transition-all duration-500"
                        style={{
                          height: `${h}%`,
                          backgroundColor: activeProduct.color,
                          opacity: 0.7 + i * 0.04,
                        }}
                      />
                    ))}
                  </div>

                  {/* List items */}
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
                      >
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: `${activeProduct.color}30` }}
                        />
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-2/3 mb-1" />
                          <div className="h-2 bg-gray-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
