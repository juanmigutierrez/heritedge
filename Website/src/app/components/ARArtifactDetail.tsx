import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Volume2, RotateCcw } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

type TabType = "exterior" | "construction" | "cultural";

const landmarkData = {
  duomo: {
    name: "Duomo di Milano",
    images: {
      medieval: "https://images.unsplash.com/photo-1611165967659-c382c59011bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhdGhlZHJhbCUyMGdvdGhpYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ3MjI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      postwar: "https://images.unsplash.com/photo-1712118849585-cecd77a4a738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGl0YWxpYW4lMjBidWlsZGluZyUyMHJlc3RvcmF0aW9ufGVufDF8fHx8MTc3NDcyMjkzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      present: "https://images.unsplash.com/photo-1688674966559-fe9f9d661c80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW9tbyUyMG1pbGFubyUyMGNhdGhlZHJhbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NDcyMjkzNnww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    facts: {
      medieval: {
        exterior: "The Duomo's Gothic facade features pink-white Candoglia marble with intricate spires beginning construction in 1386.",
        construction: "Built over 135 spires with 3,400 statues. Master builders from across Europe contributed to its design.",
        cultural: "Symbolized Milan's ambition as a major European power center and religious hub during the Renaissance.",
      },
      postwar: {
        exterior: "Post-WWII restoration repaired bomb damage while maintaining the Gothic integrity of the marble facade.",
        construction: "Engineers used new techniques to stabilize war-damaged sections without altering historical appearance.",
        cultural: "Became a symbol of Milan's resilience and recovery, hosting ceremonies celebrating reconstruction.",
      },
      present: {
        exterior: "Modern conservation maintains the 135 spires and over 3,400 statues using advanced preservation methods.",
        construction: "Ongoing restoration uses laser cleaning and 3D scanning to preserve architectural details.",
        cultural: "Serves as Milan's spiritual and cultural heart, attracting millions while hosting religious ceremonies.",
      },
    },
  },
  galleria: {
    name: "Galleria Vittorio Emanuele II",
    images: {
      medieval: "https://images.unsplash.com/photo-1611165967659-c382c59011bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhdGhlZHJhbCUyMGdvdGhpYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ3MjI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      postwar: "https://images.unsplash.com/photo-1712118849585-cecd77a4a738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGl0YWxpYW4lMjBidWlsZGluZyUyMHJlc3RvcmF0aW9ufGVufDF8fHx8MTc3NDcyMjkzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      present: "https://images.unsplash.com/photo-1671232847170-b31a815afcf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYWxsZXJpYSUyMHZpdHRvcmlvJTIwZW1hbnVlbGUlMjBtaWxhbm98ZW58MXx8fHwxNzc0NzIyOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    facts: {
      medieval: {
        exterior: "This area was not yet developed during medieval times - it was open space near the Duomo.",
        construction: "No structure existed here in the medieval period.",
        cultural: "The area served as a gathering space for religious processions and public events.",
      },
      postwar: {
        exterior: "The glass arcade survived WWII with minimal damage, maintaining its iconic iron and glass dome.",
        construction: "Post-war repairs focused on restoring the mosaic floors and glass panels damaged during bombing.",
        cultural: "Quickly became a symbol of Italian style and elegance during the economic boom of the 1950s.",
      },
      present: {
        exterior: "Features a stunning glass-vaulted arcade with iron framework, connecting Piazza Duomo to Teatro alla Scala.",
        construction: "Built 1865-1877 by architect Giuseppe Mengoni, it's one of the world's oldest shopping malls.",
        cultural: "A luxury shopping destination and social meeting point, representing Milanese fashion and lifestyle.",
      },
    },
  },
  palazzo: {
    name: "Palazzo Reale",
    images: {
      medieval: "https://images.unsplash.com/photo-1611165967659-c382c59011bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhdGhlZHJhbCUyMGdvdGhpYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ3MjI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      postwar: "https://images.unsplash.com/photo-1712118849585-cecd77a4a738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGl0YWxpYW4lMjBidWlsZGluZyUyMHJlc3RvcmF0aW9ufGVufDF8fHx8MTc3NDcyMjkzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
      present: "https://images.unsplash.com/photo-1620030537215-9ef4d9c0d3ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWxhenpvJTIwcmVhbGUlMjBtaWxhbm8lMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzc0NzIyOTM2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    facts: {
      medieval: {
        exterior: "Originally a medieval fortress and seat of government from the 11th century onwards.",
        construction: "Built as a fortified palace with defensive walls and towers for ruling families.",
        cultural: "Center of political power during the medieval Duchy of Milan under the Visconti family.",
      },
      postwar: {
        exterior: "Heavily damaged during WWII bombings, with significant portions of the neoclassical facade destroyed.",
        construction: "Major reconstruction in the 1950s restored the building while adapting it for cultural use.",
        cultural: "Transformed into a major cultural center, hosting art exhibitions and cultural events for the public.",
      },
      present: {
        exterior: "Neoclassical facade adjacent to the Duomo, now serving as a prestigious cultural center.",
        construction: "Restored after WWII damage, maintaining historical architecture while housing modern exhibition spaces.",
        cultural: "One of Milan's premier art venues, hosting world-class exhibitions and cultural events year-round.",
      },
    },
  },
};

export function ARArtifactDetail() {
  const { landmarkId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const period = (searchParams.get("period") as "medieval" | "postwar" | "present") || "present";
  const [activeTab, setActiveTab] = useState<TabType>("exterior");
  const [showComparison, setShowComparison] = useState(false);

  const landmark = landmarkData[landmarkId as keyof typeof landmarkData];

  if (!landmark) {
    return null;
  }

  const handlePlayVoice = () => {
    const fact = landmark.facts[period][activeTab];
    alert(`Voice playback: ${fact}`);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg">{landmark.name}</h1>
            <p className="text-xs text-stone-500">
              {period === "medieval" && "Medieval Period"}
              {period === "postwar" && "After War (1950s)"}
              {period === "present" && "Present Day"}
            </p>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <ImageWithFallback
          src={landmark.images[period]}
          alt={landmark.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm active:scale-95 transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
            {showComparison ? "Hide" : "Show"} Comparison
          </button>
        </div>
      </div>

      {/* Comparison View */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white border-b border-stone-200 p-4"
        >
          <p className="text-xs text-stone-500 mb-3">Compare time periods:</p>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(landmark.images).map(([timePeriod, image]) => (
              <div key={timePeriod} className="relative">
                <ImageWithFallback
                  src={image}
                  alt={`${landmark.name} - ${timePeriod}`}
                  className="w-full h-24 object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xs capitalize">{timePeriod}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-stone-200 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab("exterior")}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === "exterior"
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-700"
            }`}
          >
            Exterior
          </button>
          <button
            onClick={() => setActiveTab("construction")}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === "construction"
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-700"
            }`}
          >
            Construction History
          </button>
          <button
            onClick={() => setActiveTab("cultural")}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeTab === "cultural"
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-700"
            }`}
          >
            Cultural Meaning
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-base text-stone-700 leading-relaxed">
              {landmark.facts[period][activeTab]}
            </p>
          </div>

          {/* Voice Playback */}
          <button
            onClick={handlePlayVoice}
            className="w-full mt-4 py-4 bg-white border border-stone-200 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
          >
            <Volume2 className="w-5 h-5 text-stone-600" />
            <span className="text-base text-stone-800">Play Voice Guide</span>
          </button>
        </motion.div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/ar-overview")}
          className="w-full mt-6 py-4 bg-stone-800 text-white rounded-2xl active:scale-[0.98] transition-transform"
        >
          Back to Piazza Overview
        </button>
      </div>
    </div>
  );
}
