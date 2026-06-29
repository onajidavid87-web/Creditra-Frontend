import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
    TrendingUp,
    ShieldCheck,
    Cpu,
    RefreshCcw,
    Wallet,
    BarChart3,
    CreditCard,
    LineChart,
    Building2,
    Code2,
    Users,
} from "lucide-react";
import { getVariant, getHeroCopy, FEATURES, HOW_IT_WORKS, USE_CASES, FAQ, FINAL_CTA, HEADER, FOOTER } from "@/copy/landing";
import "./LandingPage.css";

export default function LandingPage() {
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const reduceMotion = useReducedMotion();

    const variant = getVariant();
    const hero = getHeroCopy(variant);

    const featureIcons = [TrendingUp, ShieldCheck, Cpu, RefreshCcw];
    const stepIcons = [Wallet, BarChart3, Cpu, CreditCard, LineChart];
    const useCaseIcons = [Building2, Code2, Users];

    return (
        <div className="bg-[#0d1117] text-[#f0f6fc] min-h-screen font-sans">
            {/* HEADER */}
            <header className="border-b border-[#21262d]">
                <div className="max-w-300 mx-auto flex items-center justify-between h-18 px-6">
                    <div className="text-xl font-semibold tracking-tight">
                        {HEADER.brand}
                    </div>
                    <nav className="hidden md:flex gap-8 text-[#8b949e]">
                        <a href="#how" className="hover:text-white transition">{HEADER.nav[0]}</a>
                        <a href="#usecases" className="hover:text-white transition">{HEADER.nav[1]}</a>
                        <a href="#faq" className="hover:text-white transition">{HEADER.nav[2]}</a>
                    </nav>
                    <button className="bg-[#58a6ff] hover:bg-[#79c0ff] px-5 py-2 rounded-lg transition text-black font-medium">
                        {HEADER.cta}
                    </button>
                </div>
            </header>

            {/* HERO */}
            <section className="landing-section landing-hero relative overflow-hidden">
                <div className="max-w-300 mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-6">
                        <h1 className="landing-hero__title">
                            {hero.title}
                        </h1>
                        <p className="landing-hero__copy">
                            {hero.subtitle}
                        </p>
                        <div className="landing-hero__actions">
                            <button type="button" className="landing-button landing-button--primary">
                                {hero.primaryCta}
                            </button>
                            <a href="#how" className="landing-button landing-button--secondary">
                                {hero.secondaryCta}
                            </a>
                        </div>
                    </div>

                    {/* Animated Adaptive Credit Card */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: reduceMotion ? 0 : 1 }}
                        className="landing-hero-card"
                    >
                        <p className="text-[#8b949e] mb-4">Dynamic Credit Limit</p>
                        <div
                            className="w-full h-4 bg-[#21262d] rounded"
                            role="progressbar"
                            aria-valuenow={85}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Adaptive credit limit growth preview"
                        >
                            <motion.div
                                initial={{ width: reduceMotion ? "85%" : "20%" }}
                                animate={{ width: "85%" }}
                                transition={{ duration: reduceMotion ? 0 : 3 }}
                                className="h-4 bg-[#58a6ff] rounded"
                            />
                        </div>
                        <p className="mt-6 text-3xl font-semibold">$48,750</p>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="landing-section">
                <div className="max-w-300 mx-auto px-6">
                    <h2 className="landing-section-title text-center">{FEATURES.title}</h2>
                    <div className="landing-feature-grid">
                        {FEATURES.items.map(({ title, description }, i) => {
                            const Icon = featureIcons[i];
                            return (
                                <div key={i} className="landing-card">
                                    <div className="w-10 h-10 mb-6 flex items-center justify-center rounded-lg bg-[#58a6ff]/10">
                                        <Icon className="text-[#58a6ff]" size={20} />
                                    </div>
                                    <h3 className="landing-card-title">{title}</h3>
                                    <p className="landing-card-copy">{description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="landing-section bg-[#0b0f14]">
                <div className="max-w-300 mx-auto px-6">
                    <h2 className="landing-section-title text-center">{HOW_IT_WORKS.title}</h2>
                    <div className="landing-steps-grid text-center">
                        {HOW_IT_WORKS.steps.map((label, i) => {
                            const Icon = stepIcons[i];
                            return (
                                <div key={i} className="relative">
                                    <div className="landing-card rounded-lg p-6 flex flex-col items-center gap-4">
                                        <Icon className="text-[#58a6ff]" size={22} aria-hidden="true" />
                                        <span>{label}</span>
                                    </div>
                                    {i < 4 && (
                                        <div className="hidden md:block absolute top-1/2 -right-4.5 w-4 h-0.5 bg-[#58a6ff]" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* USE CASES */}
            <section id="usecases" className="landing-section">
                <div className="max-w-300 mx-auto px-6">
                    <h2 className="landing-section-title text-center">{USE_CASES.title}</h2>
                    <div className="landing-usecases-grid">
                        {USE_CASES.items.map(({ title, description }, i) => {
                            const Icon = useCaseIcons[i];
                            return (
                                <div key={i} className="landing-card">
                                    <div className="w-10 h-10 mb-6 flex items-center justify-center rounded-lg bg-[#58a6ff]/10">
                                        <Icon className="text-[#58a6ff]" size={20} />
                                    </div>
                                    <h3 className="landing-card-title">{title}</h3>
                                    <p className="landing-card-copy">{description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="landing-section bg-[#0b0f14]">
                <div className="max-w-200 mx-auto px-6">
                    <h2 className="text-3xl font-semibold mb-12 text-center">{FAQ.title}</h2>
                    {FAQ.items.map((item, index) => (
                        <div key={index} className="border border-[#21262d] rounded-lg mb-4">
                            <button
                                className="w-full text-left p-5 flex justify-between items-center"
                                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                                aria-expanded={openFAQ === index}
                                aria-controls={`faq-answer-${index}`}
                            >
                                {item.q}
                                <span aria-hidden="true">{openFAQ === index ? "\u2212" : "+"}</span>
                            </button>
                            {openFAQ === index && (
                                <div id={`faq-answer-${index}`} className="px-5 pb-5 text-[#8b949e]" role="region">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="landing-section text-center">
                <div className="max-w-200 mx-auto px-6">
                    <h2 className="landing-section-title mb-8">{FINAL_CTA.title}</h2>
                    <button type="button" className="landing-button landing-button--primary">
                        {FINAL_CTA.button}
                    </button>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-[#21262d] py-12 text-[#8b949e]">
                <div className="max-w-300 mx-auto px-6 grid md:grid-cols-3 gap-8">
                    {FOOTER.columns.map(({ heading, links }) => (
                        <div key={heading}>
                            <h4 className="text-white mb-4 font-medium">{heading}</h4>
                            {links.map((link) => (
                                <p key={link}>{link}</p>
                            ))}
                        </div>
                    ))}
                </div>
            </footer>
        </div>
    );
}
