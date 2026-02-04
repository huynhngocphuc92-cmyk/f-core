import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import ProductsSection from "@/components/sections/ProductsSection";
import StatsSection from "@/components/sections/StatsSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import IntegrationsSection from "@/components/sections/IntegrationsSection";
import PricingSection from "@/components/sections/PricingSection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <ProductsSection />
        <TestimonialsSection />
        <IntegrationsSection />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
