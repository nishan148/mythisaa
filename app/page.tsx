import { FAQ } from "@/components/sections/faq";
import { Features } from "@/components/sections/features";
import { FinalCTA } from "@/components/sections/final-cta";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Navbar } from "@/components/sections/navbar";
import { Pricing } from "@/components/sections/pricing";
import { ProductShowcase } from "@/components/sections/product-showcase";
import { Testimonials } from "@/components/sections/testimonials";
import { Trusted } from "@/components/sections/trusted";
import { WhyMythMind } from "@/components/sections/why-mythmind";

export default function Home() {
  return (
    <>
      <a href="#main-content" className="sr-only z-[100] bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to content</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <Trusted />
        <Features />
        <ProductShowcase />
        <HowItWorks />
        <WhyMythMind />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}