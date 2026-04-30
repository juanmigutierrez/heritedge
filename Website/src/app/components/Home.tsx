import { Link } from "react-router";
import { motion } from "motion/react";
import { MessageCircle, Compass, Trophy, ChevronRight, Camera, Bot } from "lucide-react";
import heroImage from "figma:asset/e451b2f471ffbfb42d11bb840cae8796323fade8.png";

export function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex flex-col">
      {/* Hero Section */}
      <div className="relative h-[45vh] overflow-hidden bg-stone-50">
        <img
          src={heroImage}
          alt="Duomo di Milano"
          className="w-full h-full object-contain p-8"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-100/90 via-transparent to-transparent" />
        
        {/* Title Overlay */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 p-6 text-stone-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl mb-2">Explore Piazza Duomo</h1>
          <p className="text-base text-stone-600">
            Discover Milano's heritage through time
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.5 }}
        >
          <Link to="/ai-chat">
            <div className="bg-white rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-rose-700" />
                </div>
                <ChevronRight className="w-6 h-6 text-stone-400" />
              </div>
              <h2 className="text-xl mb-1">Open AI Chat</h2>
              <p className="text-sm text-stone-600">
                Ask questions about Piazza del Duomo and get guided answers from the knowledge base
              </p>
            </div>
          </Link>
        </motion.div>

        {/* Main CTA Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Link to="/quick-guide">
            <div className="bg-white rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-amber-700" />
                </div>
                <ChevronRight className="w-6 h-6 text-stone-400" />
              </div>
              <h2 className="text-xl mb-1">Start Quick Guide</h2>
              <p className="text-sm text-stone-600">
                Explore heritage through Medieval, Post-War & Present times with AI assistant
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Link to="/ar-overview">
            <div className="bg-white rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg 
                    className="w-6 h-6 text-blue-700" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <ChevronRight className="w-6 h-6 text-stone-400" />
              </div>
              <h2 className="text-xl mb-1">Enter AR Experience</h2>
              <p className="text-sm text-stone-600">
                Explore historical time periods through augmented reality
              </p>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link to="/treasure-hunt">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 shadow-sm active:scale-[0.98] transition-transform text-white">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-6 h-6 text-white/80" />
              </div>
              <h2 className="text-xl mb-1">AR Treasure Hunt</h2>
              <p className="text-sm text-white/90">
                Find artifacts, answer questions, and capture photos in an AR scavenger hunt
              </p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}