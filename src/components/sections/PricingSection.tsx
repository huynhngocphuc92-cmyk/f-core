"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started with CRM basics",
    features: [
      "Up to 1,000 contacts",
      "Email marketing (2,000 emails/month)",
      "Forms & landing pages",
      "Live chat",
      "Reporting dashboard",
      "Mobile app",
    ],
    cta: "Get started free",
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$20",
    period: "/month",
    description: "Essential tools for small teams getting started",
    features: [
      "Everything in Free, plus:",
      "Up to 5,000 contacts",
      "Email marketing (5x contact tier)",
      "Remove F-CORE branding",
      "Simple automation",
      "Multiple currencies",
    ],
    cta: "Start free trial",
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    price: "$890",
    period: "/month",
    description: "Complete platform for growing businesses",
    features: [
      "Everything in Starter, plus:",
      "Up to 50,000 contacts",
      "Marketing automation",
      "Custom reporting",
      "A/B testing",
      "Teams & permissions",
      "Phone support",
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "Advanced features for large organizations",
    features: [
      "Everything in Professional, plus:",
      "Unlimited contacts",
      "Advanced permissions",
      "Predictive lead scoring",
      "Custom objects",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact sales",
    popular: false,
  },
];

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${
              billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
            }
            className="relative w-14 h-7 rounded-full bg-gray-200 transition-colors"
            style={{
              backgroundColor: billingCycle === "annual" ? "#0891b2" : undefined,
            }}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                billingCycle === "annual" ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${
              billingCycle === "annual" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs text-[#0891b2] font-semibold">
              Save 20%
            </span>
          </span>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 ${
                plan.popular
                  ? "bg-[#0891b2] text-white ring-2 ring-[#0891b2] ring-offset-2"
                  : "bg-white border border-gray-200"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-cyan-300 text-[#0891b2] text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              {/* Plan name */}
              <div
                className={`text-lg font-semibold mb-2 ${
                  plan.popular ? "text-white" : "text-gray-900"
                }`}
              >
                {plan.name}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-2">
                <span
                  className={`text-4xl font-bold ${
                    plan.popular ? "text-white" : "text-gray-900"
                  }`}
                >
                  {billingCycle === "annual" && plan.price !== "$0" && plan.price !== "Custom"
                    ? `$${Math.round(parseInt(plan.price.replace("$", "")) * 0.8)}`
                    : plan.price}
                </span>
                <span
                  className={`text-sm ${
                    plan.popular ? "text-white/80" : "text-gray-500"
                  }`}
                >
                  {plan.period}
                </span>
              </div>

              {/* Description */}
              <p
                className={`text-sm mb-6 ${
                  plan.popular ? "text-white/80" : "text-gray-600"
                }`}
              >
                {plan.description}
              </p>

              {/* CTA */}
              <button
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-colors mb-6 ${
                  plan.popular
                    ? "bg-white text-[#0891b2] hover:bg-gray-100"
                    : "bg-[#0891b2] text-white hover:bg-[#0ea5e9]"
                }`}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check
                      className={`w-5 h-5 flex-shrink-0 ${
                        plan.popular ? "text-cyan-300" : "text-[#0891b2]"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        plan.popular ? "text-white/90" : "text-gray-600"
                      }`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12">
          <p className="text-gray-500">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
