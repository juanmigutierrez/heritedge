import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Compass, Trophy, ChevronRight, Camera } from "lucide-react";
import heroImage from "../../assets/heritage-sites.png";
import duomoImg from "../../assets/duomo.png";
import galleriaImg from "../../assets/galleria.png";
import palazzoImg from "../../assets/palazzo.png";

export function Home() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      <div className="relative h-[60vh] flex items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200 overflow-hidden">

  {/* Background Glow */}
  <div className="absolute w-[500px] h-[500px] bg-amber-200/30 rounded-full blur-3xl top-10"></div>

  {/* Hero Image */}
  <img
    src={heroImage}
    alt="Piazza Duomo Illustration"
    className="relative z-10 w-[85%] max-w-md object-contain"
  />

  {/* Text Overlay */}
  <div className="absolute bottom-0 w-full p-6 text-center z-20">
    <h1 className="text-3xl font-semibold text-stone-800 mb-2">
      Piazza Duomo
    </h1>
    <p className="text-sm text-stone-600 mb-4">
      Explore Milan’s iconic square through history, culture, and immersive experiences
    </p>

    <Link to="/quick-guide">
      <button className="bg-stone-900 text-white px-6 py-2 rounded-full text-sm shadow-md active:scale-95 transition">
        Start Exploring
      </button>
    </Link>
  </div>
</div>

      {/* INTRO */}
      <div className="px-6 py-8">
        <h2 className="text-2xl font-semibold mb-3">
          Discover the Square
        </h2>
        <p className="text-stone-600 text-sm leading-relaxed">
          Piazza Duomo is home to Milan’s most iconic landmarks — the majestic
          Duomo Cathedral, the elegant Galleria Vittorio Emanuele II, and the
          historic Palazzo Reale. Each tells a story across centuries of art,
          architecture, and culture.
        </p>
      </div>

      <div className="px-6 py-6">
  <h2 className="text-xl font-semibold mb-4">Iconic Landmarks</h2>

  <div className="grid grid-cols-3 gap-3">

    {/* DUOMO */}
    <Link to="/duomo">
      <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-sm active:scale-95 transition">

        <img
          src={duomoImg}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute bottom-0 p-2 text-white">
          <h3 className="text-[11px] font-semibold leading-tight">
            Duomo
          </h3>
        </div>

      </div>
    </Link>

    {/* GALLERIA */}
    <Link to="/galleria">
      <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-sm active:scale-95 transition">

        <img
          src={galleriaImg}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute bottom-0 p-2 text-white">
          <h3 className="text-[11px] font-semibold leading-tight">
            Galleria
          </h3>
        </div>

      </div>
    </Link>

    {/* PALAZZO */}
    <Link to="/palazzo">
      <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-sm active:scale-95 transition">

        <img
          src={palazzoImg}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute bottom-0 p-2 text-white">
          <h3 className="text-[11px] font-semibold leading-tight">
            Palazzo
          </h3>
        </div>

      </div>
    </Link>

  </div>
</div>

      {/* EXPERIENCES */}
      <div className="px-6 py-8 space-y-4">

        <h2 className="text-xl font-semibold">Experiences</h2>

        {/* QUICK GUIDE */}
        <Link to="/quick-guide">
          <div className="bg-white rounded-2xl p-5 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-medium">Quick Guide</h3>
              <p className="text-sm text-stone-500">
                AI-powered historical journey
              </p>
            </div>
            <ChevronRight />
          </div>
        </Link>

        {/* AR */}
        <Link to="/ar-overview">
          <div className="bg-white rounded-2xl p-5 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-medium">AR Experience</h3>
              <p className="text-sm text-stone-500">
                See history through your camera
              </p>
            </div>
            <ChevronRight />
          </div>
        </Link>

        {/* TREASURE */}
        <Link to="/treasure-hunt">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-5 flex justify-between items-center">
            <div>
              <h3 className="font-medium">Treasure Hunt</h3>
              <p className="text-sm text-white/90">
                Interactive AR challenges
              </p>
            </div>
            <ChevronRight />
          </div>
        </Link>

      </div>
    </div>
  );
}