
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MemoryItem } from '@/types/memory';
import { NEXUS_COLORS, getPlatformColor } from '@/lib/designSystem';
import { Network, MessageSquare, Info, X, ZoomIn, ZoomOut } from 'lucide-react';

interface KnowledgeGraphProps {
  items: MemoryItem[];
  onNodeClick?: (item: MemoryItem) => void;
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  item: MemoryItem;
  connections: number;
}

interface Link {
  source: string;
  target: string;
  strength: number;
}

export default function KnowledgeGraph({ items, onNodeClick }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);

  // Calculate graph data
  const graphData = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    // Create nodes with initial positions (circular layout)
    items.forEach((item, index) => {
      const angle = (index / items.length) * Math.PI * 2;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.3;
      
      nodes.push({
        id: item.id,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: item.favorite ? 20 : 12,
        color: getPlatformColor(item.type),
        item: item,
        connections: 0
      });
    });

    // Create links based on shared keywords and emotions
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const k1 = items[i].keywords || [];
        const k2 = items[j].keywords || [];
        const intersection = k1.filter(x => k2.includes(x));
        const sameEmotion = items[i].emotion && items[j].emotion && 
                           items[i].emotion === items[j].emotion;

        if (intersection.length > 0 || sameEmotion) {
          const strength = intersection.length + (sameEmotion ? 1 : 0);
          links.push({
            source: items[i].id,
            target: items[j].id,
            strength
          });
          
          const sourceNode = nodes.find(n => n.id === items[i].id);
          const targetNode = nodes.find(n => n.id === items[j].id);
          if (sourceNode) sourceNode.connections++;
          if (targetNode) targetNode.connections++;
        }
      }
    }

    return { nodes, links };
  }, [items, dimensions]);

  // Update refs when data changes
  useEffect(() => {
    nodesRef.current = graphData.nodes;
    linksRef.current = graphData.links;
  }, [graphData]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const parent = canvasRef.current.parentElement;
        setDimensions({
          width: parent.clientWidth,
          height: 500
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Physics simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const simulate = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Apply forces
      nodes.forEach(node => {
        // Center gravity
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        const dx = centerX - node.x;
 const dy = centerY - node.y;
        node.vx += dx * 0.0001;
        node.vy += dy * 0.0001;

        // Damping
        node.vx *= 0.9;
        node.vy *= 0.9;
      });

      // Link forces
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const ideal = 100 * link.strength;
          const force = (distance - ideal) * 0.01;

          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      // Node repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0 && distance < 200) {
            const force = 500 / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            nodes[i].vx -= fx;
            nodes[i].vy -= fy;
            nodes[j].vx += fx;
            nodes[j].vy += fy;
          }
        }
      }

      // Update positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Boundaries with bounce
        const margin = node.radius + 10;
        if (node.x < margin) { node.x = margin; node.vx *= -0.5; }
        if (node.x > dimensions.width - margin) { node.x = dimensions.width - margin; node.vx *= -0.5; }
        if (node.y < margin) { node.y = margin; node.vy *= -0.5; }
        if (node.y > dimensions.height - margin) { node.y = dimensions.height - margin; node.vy *= -0.5; }
      });

      // Render
      render();
      animationId = requestAnimationFrame(simulate);
    };

    const render = () => {
      if (!ctx) return;

      // Clear
      ctx.fillStyle = NEXUS_COLORS.bg.primary;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const nodes = nodesRef.current;
      const links = linksRef.current;

      // Draw links
      ctx.globalAlpha = 0.2;
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x * zoom, source.y * zoom);
          ctx.lineTo(target.x * zoom, target.y * zoom);
          ctx.strokeStyle = NEXUS_COLORS.border.subtle;
          ctx.lineWidth = link.strength;
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      // Draw nodes
      nodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        
        // Glow effect for hovered/selected
        if (isHovered || isSelected) {
          const gradient = ctx.createRadialGradient(
            node.x * zoom, node.y * zoom, 0,
            node.x * zoom, node.y * zoom, node.radius * 2 * zoom
          );
          gradient.addColorStop(0, node.color + '40');
          gradient.addColorStop(1, node.color + '00');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(node.x * zoom, node.y * zoom, node.radius * 2 * zoom, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x * zoom, node.y * zoom, node.radius * zoom, 0, Math.PI * 2);
        
        // Gradient fill
        const gradient = ctx.createRadialGradient(
          node.x * zoom - node.radius * zoom / 3, 
          node.y * zoom - node.radius * zoom / 3, 
          0,
          node.x * zoom, 
          node.y * zoom, 
          node.radius * zoom
        );
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, node.color + 'cc');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Border
        ctx.strokeStyle = isHovered || isSelected ? NEXUS_COLORS.brand.accent : node.color + '80';
        ctx.lineWidth = isHovered || isSelected ? 3 : 2;
        ctx.stroke();

        // Favorite star
        if (node.item.favorite) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = `${node.radius * zoom}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', node.x * zoom, node.y * zoom);
        }

        // Connection count badge
        if (node.connections > 0 && (isHovered || isSelected)) {
          const badgeX = node.x * zoom + node.radius * zoom * 0.7;
          const badgeY = node.y * zoom - node.radius * zoom * 0.7;
          
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, 10 * zoom, 0, Math.PI * 2);
          ctx.fillStyle = NEXUS_COLORS.brand.accent;
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${10 * zoom}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.connections.toString(), badgeX, badgeY);
        }
      });
    };

    simulate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [dimensions, zoom, hoveredNode, selectedNode]);

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const nodes = nodesRef.current;
    const hovered = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    setHoveredNode(hovered || null);
    if (canvas.style) {
      canvas.style.cursor = hovered ? 'pointer' : 'default';
    }
  }, [zoom]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
      onNodeClick?.(hoveredNode.item);
    }
  }, [hoveredNode, onNodeClick]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  if (items.length === 0) {
    return (
      <div className="w-full h-[500px] bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Network className="w-16 h-16 text-zinc-700 mx-auto" />
          <p className="text-zinc-500 text-sm">No memories to visualize yet</p>
          <p className="text-zinc-600 text-xs">Saved memories will appear here as connections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-full flex items-center gap-3 shadow-lg">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse"></div>
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-cyan-500 blur-sm animate-ping"></div>
          </div>
          <span className="text-xs font-bold tracking-wider text-zinc-100">
            MEMORY NETWORK
          </span>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-zinc-400" />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-lg text-xs text-zinc-400 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            <span>{items.length} Memories</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>{linksRef.current.length} Connections</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="w-full h-full"
      />

      {/* Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl max-w-xs">
            <div className="flex items-start gap-2">
              <div 
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: hoveredNode.color }}
              />
              <div>
                <p className="text-zinc-100 text-sm font-semibold line-clamp-2">
                  {hoveredNode.item.title}
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  {hoveredNode.connections} connection{hoveredNode.connections !== 1 ? 's' : ''}
                </p>
                {hoveredNode.item.favorite && (
                  <span className="inline-block mt-1 text-yellow-500 text-xs">★ Favorite</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 px-3 py-2 rounded-lg text-[10px] text-zinc-500">
          <p>Click: Select • Drag: Move • Scroll: Zoom</p>
        </div>
      </div>
    </div>
  );
}
