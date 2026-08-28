import type { Metadata } from "next";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import WhyChooseSection from "@/components/sections/WhyChooseSection";
import StatsSection from "@/components/sections/StatsSection";
import CTASection from "@/components/sections/CTASection";

export const metadata: Metadata = {
  title: "BloodLink – Smart Blood Donor Finder | Connect Donors & Save Lives",
  description:
    "BloodLink is a real-time blood donor finder platform that connects patients with nearby blood donors and blood banks instantly. Powered by OpenStreetMap & Leaflet, Socket.IO, and live inventory management.",
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
      <WhyChooseSection />
      <StatsSection />
      <CTASection />
    </main>
  );
}
