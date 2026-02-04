"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    quote:
      "F-CORE has transformed how we manage our customer relationships. The automation features alone have saved us countless hours every week.",
    author: "Sarah Chen",
    title: "VP of Sales",
    company: "TechFlow Inc.",
    avatar: "SC",
  },
  {
    id: 2,
    quote:
      "The integration capabilities are incredible. We connected all our tools in days, not months. Our team productivity increased by 40%.",
    author: "Michael Rodriguez",
    title: "Marketing Director",
    company: "GrowthBase",
    avatar: "MR",
  },
  {
    id: 3,
    quote:
      "Finally, a CRM that actually helps us close deals faster. The pipeline visibility and forecasting features are game-changers.",
    author: "Emily Watson",
    title: "CEO",
    company: "StartupLabs",
    avatar: "EW",
  },
  {
    id: 4,
    quote:
      "Customer service has never been easier. Our response times dropped by 60% and customer satisfaction is at an all-time high.",
    author: "David Kim",
    title: "Head of Support",
    company: "CloudServe",
    avatar: "DK",
  },
];

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Loved by businesses worldwide
          </h2>
          <p className="text-lg text-gray-600">
            See what our customers have to say about growing with F-CORE
          </p>
        </div>

        {/* Testimonials carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main testimonial card */}
          <div className="bg-gray-50 rounded-2xl p-8 lg:p-12 relative">
            {/* Quote icon */}
            <div className="absolute top-8 left-8 lg:top-12 lg:left-12">
              <Quote className="w-10 h-10 text-[#0891b2]/20" />
            </div>

            {/* Content */}
            <div className="pt-8">
              <blockquote className="text-xl lg:text-2xl text-gray-900 font-medium mb-8 leading-relaxed">
                &ldquo;{testimonials[activeIndex].quote}&rdquo;
              </blockquote>

              {/* Author info */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-[#0891b2] flex items-center justify-center text-white font-semibold text-lg">
                  {testimonials[activeIndex].avatar}
                </div>

                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonials[activeIndex].author}
                  </div>
                  <div className="text-gray-600">
                    {testimonials[activeIndex].title} at {testimonials[activeIndex].company}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevTestimonial}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    index === activeIndex ? "bg-[#0891b2]" : "bg-gray-300"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Company logos */}
        <div className="mt-16 pt-12 border-t border-gray-100">
          <p className="text-center text-sm text-gray-500 mb-8">
            Trusted by industry leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {["Stripe", "Notion", "Figma", "Linear", "Vercel", "Framer"].map(
              (company) => (
                <span
                  key={company}
                  className="text-xl font-semibold text-gray-300 hover:text-gray-400 transition-colors"
                >
                  {company}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
