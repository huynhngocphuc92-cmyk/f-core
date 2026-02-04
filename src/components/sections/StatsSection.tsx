import { Users, Globe, Puzzle, Award } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "228,000+",
    label: "Customers worldwide",
    description: "Growing businesses trust F-CORE",
  },
  {
    icon: Globe,
    value: "150+",
    label: "Countries",
    description: "Global reach, local impact",
  },
  {
    icon: Puzzle,
    value: "1,400+",
    label: "Integrations",
    description: "Connect your favorite tools",
  },
  {
    icon: Award,
    value: "#1",
    label: "CRM Platform",
    description: "G2 Leader for 15 quarters",
  },
];

export default function StatsSection() {
  return (
    <section className="py-16 lg:py-24 bg-[#0891b2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-4">
                <stat.icon className="w-6 h-6 text-white" />
              </div>

              {/* Value */}
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2">
                {stat.value}
              </div>

              {/* Label */}
              <div className="text-lg font-semibold text-white/90 mb-1">
                {stat.label}
              </div>

              {/* Description */}
              <div className="text-sm text-white/70">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
