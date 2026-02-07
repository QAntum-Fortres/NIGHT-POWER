/**
 * NEURAL CORE LIVE FEED
 * Real-time vectorization stream from NeuralCoreMagnet.ts
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Database, Network, Activity, 
  TrendingUp, Clock, Target, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNexusStore } from '@/stores/nexus-store';

interface VectorEvent {
  id: string;
  namespace: string;
  dimension: number;
  similarity: number;
  content: string;
  timestamp: Date;
}

export function NeuralCoreFeed() {
  const [events, setEvents] = React.useState<VectorEvent[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalVectors: 52573,
    activeNamespace: 'empire',
    dimension: 512,
    avgSimilarity: 0.847,
    vectorsPerMinute: 45,
  });

  const { pineconeStats, liveFeed } = useNexusStore();

  // Simulate real-time vector events
  React.useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const newEvent: VectorEvent = {
        id: crypto.randomUUID(),
        namespace: 'empire',
        dimension: 512,
        similarity: 0.7 + Math.random() * 0.3,
        content: [
          'Processing neural pattern...',
          'Analyzing semantic context...',
          'Vector embedding complete',
          'Memory synchronization',
          'Pattern recognized',
          'Indexing new vector',
        ][Math.floor(Math.random() * 6)],
        timestamp: new Date(),
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 50));
      setStats(prev => ({
        ...prev,
        totalVectors: prev.totalVectors + 1,
        vectorsPerMinute: Math.floor(40 + Math.random() * 20),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isStreaming]);

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-[#0d0d14] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
              <Network className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Neural Core Feed</h3>
              <p className="text-xs text-gray-500">Real-time vectorization stream</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              isStreaming 
                ? 'bg-cyan-500/20 text-cyan-400' 
                : 'bg-gray-800 text-gray-400'
            )}
          >
            {isStreaming ? 'LIVE' : 'PAUSED'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-px bg-cyan-500/10">
        {[
          { label: 'Total Vectors', value: stats.totalVectors.toLocaleString(), icon: Database },
          { label: 'Namespace', value: stats.activeNamespace, icon: Target },
          { label: 'Dimension', value: stats.dimension.toString(), icon: Hash },
          { label: 'Avg Similarity', value: (stats.avgSimilarity * 100).toFixed(1) + '%', icon: TrendingUp },
          { label: 'Vectors/min', value: stats.vectorsPerMinute.toString(), icon: Zap },
        ].map((stat, i) => (
          <div key={i} className="p-3 bg-[#0d0d14]">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <stat.icon className="h-3 w-3 text-cyan-400" />
              {stat.label}
            </div>
            <div className="text-sm font-semibold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Visualization */}
      <div className="p-4 border-t border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Vector Stream</span>
        </div>
        
        {/* Stream visualization */}
        <div className="h-20 flex items-end gap-0.5 bg-[#12121a] rounded-lg p-2">
          {Array.from({ length: 60 }).map((_, i) => {
            const height = 20 + Math.random() * 80;
            return (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ 
                  duration: 0.3, 
                  delay: i * 0.02,
                  repeat: isStreaming ? Infinity : 0,
                  repeatDelay: 2,
                }}
                className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-500/10 rounded-sm"
              />
            );
          })}
        </div>
      </div>

      {/* Event List */}
      <div className="border-t border-cyan-500/20 max-h-64 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 p-3 border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors"
            >
              <div className="p-1.5 rounded bg-cyan-500/20">
                <Zap className="h-3 w-3 text-cyan-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{event.content}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{event.namespace}</span>
                  <span>•</span>
                  <span>dim: {event.dimension}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className={cn(
                  'text-sm font-medium',
                  event.similarity > 0.9 ? 'text-green-400' :
                  event.similarity > 0.8 ? 'text-cyan-400' : 'text-yellow-400'
                )}>
                  {(event.similarity * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {events.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for vector events...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NeuralCoreFeed;
