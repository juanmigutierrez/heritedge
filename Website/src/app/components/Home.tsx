import { Link } from "react-router";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";

import heroImage from "../../assets/heritage-sites.png";
import duomoImg from "../../assets/duomo.png";
import galleriaImg from "../../assets/galleria.png";
import palazzoImg from "../../assets/palazzo.png";
import quickGuideImg from "../../assets/Quick_Guide.png";
import arImg from "../../assets/AR_Experience.png";
import treasureHuntImg from "../../assets/Treasure_Hunt.png";

export function Home() {

  // 🔹 LANDMARK DATA
  const landmarks = [
    {
      name: "Duomo",
      img: duomoImg,
      path: "/duomo",
      desc: "Milan’s iconic cathedral with 135 spires and 600+ years of history",
    },
    {
      name: "Galleria",
      img: galleriaImg,
      path: "/galleria",
      desc: "A stunning 19th-century glass-roofed shopping arcade",
    },
    {
      name: "Palazzo",
      img: palazzoImg,
      path: "/palazzo",
      desc: "Historic royal palace showcasing Milanese art and culture",
    },
  ];

  // 🔹 EXPERIENCES DATA
  const experiences = [
    {
      title: "Quick Guide",
      desc: "AI-powered historical journey",
      path: "/quick-guide",
      style: "bg-white text-stone-900",
    },
    {
      title: "AR Experience",
      desc: "See history through your camera",
      path: "/ar-overview",
      style: "bg-white text-stone-900",
    },
    {
      title: "Treasure Hunt",
      desc: "Interactive AR challenges",
      path: "/treasure-hunt",
      style: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* HERO */}
<motion.div
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: false, amount: 0.3 }}
  transition={{ duration: 0.5, delay: 0.2 }}
  className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 overflow-hidden"
>

  {/* Glow */}
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1 }}
  viewport={{ once: false, amount: 0.3 }}
    transition={{ duration: 1.2, delay: 0.15 }}
    className="absolute w-[650px] h-[650px] bg-amber-200/30 rounded-full blur-3xl top-10"
  />

  {/* Image (bigger + more presence) */}
  <motion.img
    src={heroImage}
    alt="Piazza Duomo"
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: false, amount: 0.3 }}
    transition={{
      duration: 0.9,
      delay: 0.15,
      ease: [0.4, 0.1, 0.2, 1],
    }}
    className="relative z-10 w-[100%] max-w-5xl object-contain"
  />

  {/* Overlay text (stronger storytelling) */}
  <motion.div
    initial={{ opacity: 0, y: 25 }}
    whileInView={{ opacity: 1 }}
  viewport={{ once: false, amount: 0.3 }}
    transition={{ duration: 0.7, delay: 1.05 }}
    className="absolute bottom-0 w-full p-8 text-center z-20"
  >
    <h1 className="text-4xl font-semibold text-stone-800 mb-3">
      Piazza Duomo
    </h1>

    <p className="text-base text-stone-600 mb-2">
      A living square where Gothic architecture, Renaissance culture,
      and modern Milan converge into a single timeless space.
    </p>

    <p className="text-sm text-stone-500 mb-6 max-w-xl mx-auto leading-relaxed">
      Every stone here carries centuries of transformation — from medieval
      foundations to imperial influence and modern-day Milanese identity.
      This is not just a landmark; it is a continuously evolving story.
    </p>

    <Link to="/quick-guide">
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="bg-stone-900 text-white px-7 py-3 rounded-full text-sm shadow-md"
      >
        Start Exploring
      </motion.button>
    </Link>
  </motion.div>

</motion.div>

      {/* DISCOVERY SECTION (Intro + Landmarks combined) */}
<motion.div
  initial={{ opacity: 0, y: 35 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: false, amount: 0.3 }}
  transition={{
    duration: 0.25,
    ease: [0.22, 1, 0.36, 1],
  }}
  className="px-9 py-16 mb-10"
> <div className="h-10" />

  {/* INTRO TITLE */}
  <motion.h2
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.4 }}
    transition={{
      duration: 0.25,
      delay: 0.15,
      ease: [0.22, 1, 0.36, 1],
    }}
    className="text-3xl font-semibold mb-4 text-stone-900"
  >
    Discover the Square
  </motion.h2>

  {/* INTRO PARAGRAPH 1 */}
  <motion.p
    initial={{ opacity: 0, y: 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.4 }}
    transition={{
      duration: 0.25,
      delay: 0.25,
      ease: [0.22, 1, 0.36, 1],
    }}
    className="text-stone-600 text-base leading-relaxed mb-4"
  >
    Piazza Duomo is the cultural heart of Milan — a space shaped by
    centuries of ambition, art, and transformation. From sacred
    architecture to royal influence and modern urban life, every corner
    reflects a different chapter of the city’s identity.
  </motion.p>

  {/* INTRO PARAGRAPH 2 */}
  <motion.p
    initial={{ opacity: 0, y: 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.4 }}
    transition={{
      duration: 0.25,
      delay: 0.25,
      ease: [0.22, 1, 0.36, 1],
    }}
    className="text-stone-500 text-sm leading-relaxed mb-10"
  >
    As you explore, you are not just viewing landmarks — you are moving
    through time. Each structure carries its own narrative, waiting to
    be uncovered through history, detail, and interaction.
  </motion.p>

  {/* LANDMARKS TITLE */}
  <motion.h2
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.3 }}
    transition={{
      duration: 0.25,
      delay: 0.25,
      ease: [0.22, 1, 0.36, 1],
    }}
    className="text-xl font-semibold mb-5 text-stone-900"
  >
    Iconic Landmarks
  </motion.h2>

  {/* LANDMARK GRID */}
  <div className="grid grid-cols-3 gap-4">
    {landmarks.map((item, i) => (
      <Link key={item.name} to={item.path}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{
            duration: 0.25,
            delay: 0.25 + i * 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.97 }}
          className="group relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition"
        >
          <img
            src={item.img}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 group-hover:via-black/40 transition duration-300" />

          <div className="absolute bottom-0 p-2 text-white z-10">
            <h3 className="text-sm font-semibold">
              {item.name}
            </h3>
          </div>

          <div className="absolute inset-0 flex items-center justify-center text-center px-3 opacity-0 group-hover:opacity-100 transition duration-300 z-10 backdrop-blur-sm">
            <p className="text-white text-xs leading-snug">
              {item.desc}
            </p>
          </div>
        </motion.div>
      </Link>
    ))}
  </div>

</motion.div>

{/* ───────── EXPERIENCES (MAIN FOCUS) ───────── */}
<div className="px-6 py-10 space-y-10">

  {/* SECTION HEADING */}
  <div>
    <h2 className="text-3xl font-semibold text-stone-900 mb-2">
      Experiences
    </h2>
    <p className="text-stone-500 text-sm">
      Choose how you want to explore Piazza Duomo — guided, immersive, or interactive.
    </p>
  </div>

  {/* ───── QUICK GUIDE ───── */}
  <div className="bg-white rounded-2xl p-5 border border-stone-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-amber-400 space-y-4">

    <h3 className="text-xl font-semibold text-stone-900">Quick Guide</h3>

    {/* Image Placeholder */}
    <div className="w-full h-[400px] rounded-xl overflow-hidden">
  <img
    src={quickGuideImg}
    alt="Quick Guide"
    className="w-full h-full object-cover"
  />
</div>

    <p className="text-stone-600 leading-relaxed text-sm">
      Begin your journey with Luca, your personal heritage guide.
      The Quick Guide blends storytelling with interactive timelines,
      allowing you to explore 600 years of Milanese history in a way
      that feels alive and conversational. Instead of reading static
      text, you engage with history — asking questions, hearing stories,
      and diving deeper into the moments that shaped Piazza Duomo.
    </p>

    <div className="text-sm">

  <p className="font-medium text-stone-800 mb-1">
    Your Journey
  </p>

  <p className="leading-relaxed tracking-wide">

    <span className="text-black hover:text-stone-700 transition">Start</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Choose Era</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Explore Timeline</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Ask Luca</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Discover Stories</span>

  </p>

</div>

    <Link to="/quick-guide">
      <button className="mt-2 bg-stone-900 text-white px-5 py-2 rounded-full text-sm transition-all duration-300 hover:bg-stone-700 hover:shadow-md hover:scale-[1.03] active:scale-95">
  Start Guide
</button>
    </Link>
  </div>

  {/* ───── AR EXPERIENCE ───── */}
  <div className="bg-white rounded-2xl p-5 border border-stone-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400 space-y-4">

    <h3 className="text-xl font-semibold text-stone-900">AR Experience</h3>

    <div className="w-full h-[400px] rounded-xl overflow-hidden">
  <img
    src={arImg}
    alt="AR Experience"
    className="w-full h-full object-cover"
  />
</div>

    <p className="text-stone-600 leading-relaxed text-sm">
      Step beyond the present and see Piazza Duomo through augmented reality.
      Point your camera and uncover hidden layers of history — from architectural
      details to stories embedded in statues and facades. This experience turns
      the square into a living museum, where every direction reveals something new.
    </p>

    <div className="text-sm">

  <p className="font-medium text-stone-800 mb-1">
    Your Journey
  </p>

  <p className="leading-relaxed tracking-wide">

    <span className="text-black hover:text-stone-700 transition">Open Camera</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Scan Landmark</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Discover Artifact</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Explore Details</span>

  </p>

</div>

    <Link to="/ar-overview">
      <button className="mt-2 bg-stone-900 text-white px-5 py-2 rounded-full text-sm transition-all duration-300 hover:bg-stone-700 hover:shadow-md hover:scale-[1.03] active:scale-95">
  Enter AR
</button>
    </Link>
  </div>

  {/* ───── TREASURE HUNT ───── */}
  <div className="bg-white rounded-2xl p-5 border border-stone-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-emerald-400 space-y-4">

    <h3 className="text-xl font-semibold text-stone-900">Treasure Hunt</h3>

    <div className="w-full h-[400px] rounded-xl overflow-hidden">
  <img
    src={treasureHuntImg}
    alt="Treasure Hunt"
    className="w-full h-full object-cover"
  />
</div>

    <p className="text-stone-600 leading-relaxed text-sm">
      Turn exploration into a game. The Treasure Hunt challenges you to
      uncover hidden clues across the square, solve puzzles, and interact
      with landmarks in a completely new way. It’s designed to make learning
      active, social, and memorable — perfect for curious minds and explorers.
    </p>

    <div className="text-sm">

  <p className="font-medium text-stone-800 mb-1">
    Your Journey
  </p>

  <p className="leading-relaxed tracking-wide">

    <span className="text-black hover:text-stone-700 transition">Start Hunt</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Find Clues</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Solve Challenges</span>
    <span className="mx-2 text-stone-300">→</span>

    <span className="text-black hover:text-stone-700 transition">Complete Mission</span>

  </p>

</div>

    <Link to="/treasure-hunt">
      <button className="mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2 rounded-full text-sm transition-all duration-300 hover:opacity-90 hover:shadow-md hover:scale-[1.03] active:scale-95">
        Start Hunt
      </button>
    </Link>
  </div>

</div>
</div>
  );
}