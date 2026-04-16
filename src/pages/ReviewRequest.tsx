import { useState, useEffect, useRef } from "react";
import { Star, Copy, ExternalLink, MessageCircle, Camera, Phone, CheckCircle2, Heart, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Configurable Links ──
const GOOGLE_REVIEW_URL = "https://g.page/r/CYourACSReviewLink/review"; // TODO: replace with real link
const INSTAGRAM_HANDLE = "@acsbeautystudio";
const INSTAGRAM_URL = "https://www.instagram.com/acsbeautystudio";
const PHONE = "(732) 915-3430";
const WHATSAPP_NUMBER = "17329153430";

// ── Draft Templates (EN — US Market) ──
const SERVICE_OPTIONS = [
  { value: "hair", labelEn: "Hair Services", labelPt: "Cabelo" },
  { value: "brows", labelEn: "Brow Design", labelPt: "Sobrancelhas" },
  { value: "nails", labelEn: "Nail Services", labelPt: "Unhas" },
];

const HIGHLIGHT_OPTIONS = [
  { value: "quality", labelEn: "Quality of Work", labelPt: "Qualidade do Trabalho" },
  { value: "atmosphere", labelEn: "Atmosphere & Comfort", labelPt: "Ambiente & Conforto" },
  { value: "attention", labelEn: "Personalized Attention", labelPt: "Atendimento Personalizado" },
  { value: "transform", labelEn: "Amazing Transformation", labelPt: "Transformação Incrível" },
];

function generateDraft(service: string, highlight: string, name: string, city: string): string {
  const serviceLabel = SERVICE_OPTIONS.find(s => s.value === service)?.labelEn || "beauty service";
  const highlightMap: Record<string, string> = {
    quality: "The quality of work was outstanding — every detail was perfect and exactly what I wanted.",
    atmosphere: "The studio atmosphere was so welcoming and relaxing, it felt like a true self-care experience.",
    attention: "Ane Caroline gave me her full attention and really listened to what I wanted. The personalized service was exceptional.",
    transform: "The transformation was absolutely incredible — I walked out feeling like a brand new person!",
  };
  const highlightText = highlightMap[highlight] || highlightMap.quality;
  const nameCity = [name, city].filter(Boolean).join(", ");
  const signature = nameCity ? `\n\n— ${nameCity}` : "";

  return `I recently visited ACS Beauty Studio for ${serviceLabel.toLowerCase()} and had an amazing experience. ${highlightText}\n\nAne Caroline and her team are true professionals — skilled, caring, and passionate about what they do. I highly recommend ACS Beauty Studio to anyone looking for premium beauty services in Newark, NJ.${signature}`;
}

// ── ScrollReveal ──
function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}>
      {children}
    </div>
  );
}

export default function ReviewRequest() {
  const { t, language } = useLanguage();
  const [service, setService] = useState("hair");
  const [highlight, setHighlight] = useState("quality");
  const [customerName, setCustomerName] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const draft = generateDraft(service, highlight, customerName, customerCity);

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      toast.success(t("review.copied"));
    } catch {
      const ta = document.createElement("textarea");
      ta.value = draft;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success(t("review.copied"));
    }
  };

  const whatsappMsg = encodeURIComponent(
    language === "pt"
      ? "Oi Ane! Gostaria de compartilhar minhas fotos do antes & depois!"
      : "Hi Ane! I'd like to share my before & after photos!"
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Hero ── */}
      <section className="relative py-20 md:py-28 bg-[#3d3d38] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(36_40%_60%/0.12),transparent_60%)]" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
          <ScrollReveal>
            <Badge className="bg-gold/20 text-gold border-gold/30 mb-6 text-sm">
              <CheckCircle2 className="w-4 h-4 mr-1" /> {t("review.badge")}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-editorial font-bold mb-6 leading-tight">
              {t("review.hero_title_1")}<br />
              <span className="text-gold">{t("review.hero_title_2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed">
              {t("review.hero_subtitle")}
            </p>
          </ScrollReveal>

          {/* Ane Caroline personal note */}
          <ScrollReveal>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-left max-w-2xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-white/90 text-sm md:text-base leading-relaxed italic">
                    "{t("review.ane_quote")}"
                  </p>
                  <p className="text-gold font-semibold mt-3 text-sm">— Ane Caroline, {t("review.ane_title")}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Platform Cards ── */}
      <section className="py-16 md:py-20 bg-nude-light">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-editorial font-bold text-foreground mb-3">
                {t("review.platforms_title")}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t("review.platforms_subtitle")}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Google — Preferred */}
            <ScrollReveal>
              <Card className="border-2 border-gold/40 relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-light via-gold to-gold-dark" />
                <Badge className="absolute top-3 right-3 bg-gold text-white text-xs">
                  <Star className="w-3 h-3 mr-1" /> Preferred
                </Badge>
                <CardContent className="p-6 pt-8 text-center">
                  <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-editorial font-bold text-lg mb-2">Google</h3>
                  <p className="text-muted-foreground text-sm mb-4">{t("review.google_desc")}</p>
                  <Button asChild variant="hero" className="w-full">
                    <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
                      {t("review.google_cta")} <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>

            {/* Instagram */}
            <ScrollReveal>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 pt-8 text-center">
                  <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center mx-auto mb-4">
                    <Instagram className="w-7 h-7 text-pink-600" />
                  </div>
                  <h3 className="font-editorial font-bold text-lg mb-2">Instagram</h3>
                  <p className="text-muted-foreground text-sm mb-4">{t("review.instagram_desc")}</p>
                  <Button asChild variant="outline" className="w-full">
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                      {t("review.instagram_cta")} <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── How-To Steps (Google) ── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-editorial font-bold text-foreground text-center mb-10">
              {t("review.howto_title")}
            </h2>
          </ScrollReveal>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((step) => (
              <ScrollReveal key={step}>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-nude-light/50 border border-border">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gold-light to-gold-dark text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t(`review.step${step}_title`)}</h3>
                    <p className="text-muted-foreground text-sm">{t(`review.step${step}_desc`)}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Draft Generator ── */}
      <section className="py-16 md:py-20 bg-nude-light">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-editorial font-bold text-foreground mb-3">
                {t("review.draft_title")}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t("review.draft_subtitle")}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <Card className="overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{t("review.service_type")}</label>
                    <Select value={service} onValueChange={setService}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SERVICE_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>
                            {language === "pt" ? o.labelPt : o.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{t("review.highlight")}</label>
                    <Select value={highlight} onValueChange={setHighlight}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HIGHLIGHT_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>
                            {language === "pt" ? o.labelPt : o.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t("review.your_name")} <span className="text-muted-foreground">({t("review.optional")})</span>
                    </label>
                    <Input placeholder="Maria S." value={customerName} onChange={e => setCustomerName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t("review.city")} <span className="text-muted-foreground">({t("review.optional")})</span>
                    </label>
                    <Input placeholder="Newark, NJ" value={customerCity} onChange={e => setCustomerCity(e.target.value)} />
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-nude-light/70 rounded-xl p-5 mb-5 border border-border">
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">{draft}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={copyDraft} variant="hero" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" /> {t("review.copy_draft")}
                  </Button>
                  <Button asChild variant="hero-outline" className="flex-1">
                    <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
                      {t("review.open_google")} <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Share Photos ── */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollReveal>
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-editorial font-bold text-foreground mb-3">
                {t("review.photos_title")}
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                {t("review.photos_subtitle")}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            <ScrollReveal>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-editorial font-bold text-lg mb-2">WhatsApp</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {t("review.whatsapp_desc")}
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
                      <Camera className="w-4 h-4 mr-2" /> {t("review.send_photos")}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-xl bg-pink-100 flex items-center justify-center mx-auto mb-4">
                    <Instagram className="w-7 h-7 text-pink-600" />
                  </div>
                  <h3 className="font-editorial font-bold text-lg mb-2">{t("review.tag_instagram")}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {t("review.tag_desc")} <span className="font-semibold text-foreground">{INSTAGRAM_HANDLE}</span>
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                      {t("review.open_instagram")} <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── Contact Ane ── */}
      <section className="py-16 md:py-20 bg-[#3d3d38] text-white">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-editorial font-bold mb-4">
              {t("review.contact_title")}
            </h2>
            <p className="text-white/70 mb-8">
              {t("review.contact_subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="hero">
                <a href={`tel:${PHONE}`}>
                  <Phone className="w-4 h-4 mr-2" /> {t("review.call_ane")}
                </a>
              </Button>
              <Button asChild size="lg" variant="hero-outline">
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                </a>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
