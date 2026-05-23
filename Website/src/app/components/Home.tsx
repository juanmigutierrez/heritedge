import { Link } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Camera, MessageSquare, Compass } from "lucide-react";

import heroImage from "../../assets/heritage-sites.png";
import duomoImg from "../../assets/duomo.png";
import galleriaImg from "../../assets/galleria.png";
import palazzoImg from "../../assets/palazzo.png";

const landmarks = [
  { name: "Duomo", img: duomoImg, path: "/ar-overview?landmark=duomo", desc: "135 spires, 600 years of stone." },
  { name: "Galleria", img: galleriaImg, path: "/ar-overview?landmark=galleria", desc: "Milan's iron-and-glass salon." },
  { name: "Palazzo", img: palazzoImg, path: "/ar-overview?landmark=palazzo", desc: "Royal halls turned modern museum." },
];

const experiences = [
  {
    title: "Quick Guide",
    desc: "A conversational journey with Luca, your AI guide.",
    minutes: "8 min",
    path: "/quick-guide",
    icon: MessageSquare,
  },
  {
    title: "AR Experience",
    desc: "Point your camera. History layers itself onto the square.",
    minutes: "12 min",
    path: "/ar-overview",
    icon: Camera,
  },
  {
    title: "Treasure Hunt",
    desc: "Solve clues, unlock chapters, earn the rooftop story.",
    minutes: "20 min",
    path: "/treasure-hunt",
    icon: Compass,
  },
];

export function Home() {
  return (
    <div className="relative">
      {/* HERO — image first, title layered on top */}
      <section className="relative px-5 pt-10 pb-8 sm:px-8 sm:pt-14 sm:pb-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden bg-secondary border border-border"
          style={{ aspectRatio: "4 / 3" }}
        >
          <img
            src={heroImage}
            alt="Piazza del Duomo, Milan"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Subtle bottom gradient so the title is always legible */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(20,17,15,0.78) 0%, rgba(20,17,15,0.35) 35%, transparent 60%)",
            }}
          />

          {/* Title block, anchored bottom-left */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="text-[10px] sm:text-xs tracking-[0.18em] uppercase font-medium"
              style={{ color: "#E5B948" }}
            >
              Piazza del Duomo · Milano
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              className="hero-title mt-2 text-white"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.35)" }}
            >
              Six centuries,<br />
              <span style={{ color: "#E5B948" }}>twelve stops.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.32 }}
              className="mt-3 max-w-md text-sm sm:text-base text-white/85 leading-snug"
            >
              A 42-minute walk through Milan's heart. Wander at your pace —
              point, listen, ask. Edge fills in the rest.
            </motion.p>
          </div>
        </motion.div>

        {/* Primary actions, directly below the hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-5 flex flex-col sm:flex-row gap-3"
        >
          <Link to="/quick-guide" className="flex-1">
            <button
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              Start the tour <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
          <Link to="/ar-overview" className="flex-1">
            <button className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-card text-foreground font-medium text-sm hover:bg-secondary active:scale-[0.98] transition-all">
              <Camera className="h-4 w-4" /> Open AR
            </button>
          </Link>
        </motion.div>
      </section>

      {/* LANDMARKS */}
      <section className="px-5 sm:px-8 pb-12 max-w-3xl mx-auto">
        <SectionHeader
          eyebrow="Iconic landmarks"
          title="Three buildings, one square."
          desc="Tap any landmark to enter its AR overview."
        />

        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
          {landmarks.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                to={item.path}
                className="group block relative aspect-[3/4] rounded-xl overflow-hidden border border-border bg-secondary"
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <p className="text-sm font-medium leading-tight">{item.name}</p>
                  <p className="text-[11px] opacity-85 leading-snug mt-0.5 line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* EXPERIENCES */}
      <section className="px-5 sm:px-8 pb-16 max-w-3xl mx-auto">
        <SectionHeader
          eyebrow="Pick your pace"
          title="How would you like to explore?"
          desc="Each route works on foot, with one thumb."
        />

        <ul className="mt-6 space-y-3">
          {experiences.map((exp, i) => {
            const Icon = exp.icon;
            return (
              <motion.li
                key={exp.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link
                  to={exp.path}
                  className="group flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border hover:border-[var(--border-strong)] hover:bg-secondary transition-all"
                >
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-foreground">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-base font-medium text-foreground truncate">
                        {exp.title}
                      </h3>
                      <span className="text-caption shrink-0">{exp.minutes}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                      {exp.desc}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </Link>
              </motion.li>
            );
          })}
        </ul>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Made for Polimi MITA · Piazza del Duomo, Milano
        </p>
      </section>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <header>
      <p className="text-caption">{eyebrow}</p>
      <h2 className="h2 mt-2 text-foreground">{title}</h2>
      {desc && (
        <p className="mt-2 text-sm text-muted-foreground max-w-prose">{desc}</p>
      )}
    </header>
  );
}
