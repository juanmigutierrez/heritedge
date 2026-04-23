import { motion } from "motion/react";
import { X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

type TimePeriod = "medieval" | "postwar" | "present";

interface TimePeriodSelectorProps {
  currentPeriod: TimePeriod;
  onSelect: (period: TimePeriod) => void;
  onClose: () => void;
}

const periods = [
  {
    id: "medieval" as TimePeriod,
    title: "Medieval",
    subtitle: "14th - 16th Century",
    description: "Gothic architecture and construction",
    image: "https://images.unsplash.com/photo-1611165967659-c382c59011bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhdGhlZHJhbCUyMGdvdGhpYyUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQ3MjI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    color: "bg-amber-500",
  },
  {
    id: "postwar" as TimePeriod,
    title: "After War",
    subtitle: "1950s",
    description: "Post-WWII restoration era",
    image: "https://images.unsplash.com/photo-1712118849585-cecd77a4a738?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpYyUyMGl0YWxpYW4lMjBidWlsZGluZyUyMHJlc3RvcmF0aW9ufGVufDF8fHx8MTc3NDcyMjkzN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    color: "bg-stone-500",
  },
  {
    id: "present" as TimePeriod,
    title: "Present",
    subtitle: "2020s",
    description: "Modern conservation and culture",
    image: "https://images.unsplash.com/photo-1688674966559-fe9f9d661c80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdW9tbyUyMG1pbGFubyUyMGNhdGhlZHJhbCUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NDcyMjkzNnww&ixlib=rb-4.1.0&q=80&w=1080",
    color: "bg-blue-500",
  },
];

export function TimePeriodSelector({ currentPeriod, onSelect, onClose }: TimePeriodSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-end z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full bg-white rounded-t-3xl px-6 py-8 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl">Select Time Period</h2>
            <p className="text-sm text-stone-500">Travel through history</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {periods.map((period, index) => (
            <motion.button
              key={period.id}
              onClick={() => onSelect(period.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`w-full rounded-2xl overflow-hidden relative group active:scale-[0.98] transition-transform ${
                currentPeriod === period.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {/* Background Image */}
              <div className="relative h-32 overflow-hidden">
                <ImageWithFallback
                  src={period.image}
                  alt={period.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
                
                {/* Period Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 ${period.color} text-white text-xs rounded-full`}>
                  {period.subtitle}
                </div>

                {/* Current Selection Badge */}
                {currentPeriod === period.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Text Content */}
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <h3 className="text-white text-lg mb-1">{period.title}</h3>
                  <p className="text-white/80 text-sm">{period.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Comparison Tip */}
        <div className="mt-6 bg-amber-50 rounded-2xl p-4">
          <p className="text-sm text-amber-900">
            💡 <span className="font-medium">Tip:</span> Compare different time periods to see how Piazza Duomo evolved over centuries
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
