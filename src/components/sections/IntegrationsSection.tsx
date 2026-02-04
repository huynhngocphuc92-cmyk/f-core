import Link from "next/link";
import { ArrowRight } from "lucide-react";

const integrations = [
  { name: "Salesforce", category: "CRM" },
  { name: "Slack", category: "Communication" },
  { name: "Gmail", category: "Email" },
  { name: "Outlook", category: "Email" },
  { name: "Zoom", category: "Video" },
  { name: "Stripe", category: "Payments" },
  { name: "Shopify", category: "E-commerce" },
  { name: "WordPress", category: "CMS" },
  { name: "Zapier", category: "Automation" },
  { name: "Mailchimp", category: "Marketing" },
  { name: "Google Ads", category: "Advertising" },
  { name: "LinkedIn", category: "Social" },
  { name: "Facebook", category: "Social" },
  { name: "Jira", category: "Project" },
  { name: "Asana", category: "Project" },
  { name: "Zendesk", category: "Support" },
];

export default function IntegrationsSection() {
  return (
    <section className="py-20 lg:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Connect your favorite tools
          </h2>
          <p className="text-lg text-gray-600">
            F-CORE integrates with over 1,400+ apps to help you work the way you
            want. No more switching between tools.
          </p>
        </div>

        {/* Integrations grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-12">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="group bg-white rounded-xl p-4 flex flex-col items-center justify-center aspect-square border border-gray-100 hover:border-[#0891b2]/30 hover:shadow-lg hover:shadow-[#0891b2]/5 transition-all cursor-pointer"
            >
              {/* Icon placeholder */}
              <div className="w-12 h-12 rounded-lg bg-gray-100 group-hover:bg-[#0891b2]/10 flex items-center justify-center mb-3 transition-colors">
                <span className="text-lg font-bold text-gray-400 group-hover:text-[#0891b2] transition-colors">
                  {integration.name.charAt(0)}
                </span>
              </div>

              {/* Name */}
              <div className="text-sm font-medium text-gray-900 text-center">
                {integration.name}
              </div>

              {/* Category */}
              <div className="text-xs text-gray-500 mt-1">
                {integration.category}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="#"
            className="inline-flex items-center gap-2 text-[#0891b2] font-semibold hover:gap-3 transition-all"
          >
            Browse all 1,400+ integrations
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Integration stats */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0891b2] mb-2">2 min</div>
              <div className="text-gray-600">Average setup time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0891b2] mb-2">99.9%</div>
              <div className="text-gray-600">Uptime guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0891b2] mb-2">24/7</div>
              <div className="text-gray-600">Integration support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
