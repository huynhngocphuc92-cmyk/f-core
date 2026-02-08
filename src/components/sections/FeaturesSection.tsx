import {
  Users,
  BarChart3,
  Mail,
  Zap,
  Shield,
  Globe
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Get a complete view of every contact. Track interactions, deals, and activities in one place.",
  },
  {
    icon: BarChart3,
    title: "Reporting & Analytics",
    description:
      "Make data-driven decisions with customizable dashboards and detailed reports.",
  },
  {
    icon: Mail,
    title: "Email Marketing",
    description:
      "Create, personalize, and optimize your emails without designers or IT support.",
  },
  {
    icon: Zap,
    title: "Marketing Automation",
    description:
      "Automate repetitive tasks and scale your marketing campaigns efficiently.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description:
      "Keep your data safe with enterprise-grade security and compliance features.",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description:
      "Reach global audiences with multi-language content and localization tools.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to grow better
          </h2>
          <p className="text-lg text-gray-600">
            F-CORE brings your marketing, sales, and service teams together with
            tools that are powerful alone, but better together.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-100 text-[#0891b2] mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>

              {/* Hover arrow */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-6 h-6 text-[#0891b2]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-[#0891b2] font-semibold hover:gap-4 transition-all"
          >
            See all features
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
