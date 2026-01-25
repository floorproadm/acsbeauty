import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { ServicesPreview } from "@/components/home/ServicesPreview";
// import { PackagesPreview } from "@/components/home/PackagesPreview"; // ARCHIVED: Offers hidden temporarily
import { Testimonials } from "@/components/home/Testimonials";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <ServicesPreview />
        {/* ARCHIVED: PackagesPreview hidden - uncomment to restore offers section */}
        {/* <PackagesPreview /> */}
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
