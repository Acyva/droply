'use client';

import { useEffect, useRef, useState } from 'react';
import type { ItemWithTags } from '@/lib/database.types';
import { MapPin, X, Star, Trash2, ExternalLink, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface MapViewProps {
  items: ItemWithTags[];
  onItemSelect: (id: string) => void;
}

declare global {
  interface Window { L: any; }
}

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
  return leafletPromise;
}

function makePinIcon(L: any, color: string, isFavorite: boolean) {
  return L.divIcon({
    className: '',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -44],
    html: `<div style="filter:drop-shadow(0 2px 5px rgba(0,0,0,.35))">
      <svg viewBox="0 0 34 42" width="34" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 1C9.8 1 4 6.8 4 14c0 9.5 13 27 13 27S30 23.5 30 14C30 6.8 24.2 1 17 1z"
              fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="17" cy="14" r="6" fill="white" opacity=".92"/>
        ${isFavorite
          ? `<text x="17" y="18.5" text-anchor="middle" font-size="8" fill="${color}">★</text>`
          : `<circle cx="17" cy="14" r="3" fill="${color}"/>`}
      </svg></div>`,
  });
}

export default function MapView({ items, onItemSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const markersRef = useRef<any[]>([]);
  const { toggleFavorite, deleteItem } = useApp();
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<ItemWithTags | null>(null);

  const places = items.filter(i => i.latitude != null && i.longitude != null);

  // Mount map
  useEffect(() => {
    if (!containerRef.current) return;

    let active = true;

    loadLeaflet().then((L) => {
      if (!active || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([20, 0], 2);

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTR,
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      mapRef.current = map;

      // ResizeObserver keeps map correctly sized
      observerRef.current = new ResizeObserver(() => {
        map.invalidateSize();
      });
      observerRef.current.observe(containerRef.current!);

      // Double rAF ensures container has layout before invalidate
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (active) {
          map.invalidateSize();
          setReady(true);
        }
      }));
    });

    return () => {
      active = false;
      observerRef.current?.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setReady(false);
    };
  }, []);

  // Sync markers with places
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const L = window.L;
    const map = mapRef.current;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (places.length === 0) return;

    const newMarkers = places.map(place => {
      const color = place.tags[0]?.color || '#0ea5e9';
      const marker = L.marker(
        [place.latitude!, place.longitude!],
        { icon: makePinIcon(L, color, place.is_favorite) }
      );
      marker.on('click', () => {
        setSelected(place);
        map.panTo([place.latitude!, place.longitude!], { animate: true, duration: 0.4 });
      });
      marker.addTo(map);
      return marker;
    });

    markersRef.current = newMarkers;

    const coords: [number, number][] = places.map(p => [p.latitude!, p.longitude!]);
    if (coords.length === 1) {
      map.setView(coords[0], 14, { animate: true });
    } else {
      map.fitBounds(window.L.latLngBounds(coords), { padding: [60, 60], maxZoom: 14, animate: true });
    }
  }, [ready, places.map(p => p.id + p.is_favorite).join(',')]);

  const handleDelete = async (item: ItemWithTags) => {
    await deleteItem(item.id);
    setSelected(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* Leaflet map target — must fill parent */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Empty state overlay */}
      {places.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-50/90 dark:bg-stone-900/90 z-[600]">
          <div className="text-center space-y-3 p-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-stone-400" />
            </div>
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">No places yet</h3>
            <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
              Add an item with type &ldquo;Place&rdquo; and search for a location — it will appear here as a pin.
            </p>
          </div>
        </div>
      )}

      {/* Places count */}
      {places.length > 0 && (
        <div className="absolute top-3 left-3 z-[500] bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 text-xs font-medium px-3 py-1.5 rounded-full shadow border border-stone-200 dark:border-stone-700 flex items-center gap-1.5 pointer-events-none">
          <Navigation className="w-3 h-3" />
          {places.length} {places.length === 1 ? 'place' : 'places'}
        </div>
      )}

      {/* Selected place card */}
      {selected && (
        <div className="absolute bottom-5 left-3 right-3 md:left-auto md:right-5 md:w-80 z-[500]">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            {selected.preview_image_url && (
              <div className="h-32 overflow-hidden">
                <img
                  src={selected.preview_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start gap-2 mb-1.5">
                <h3 className="flex-1 text-sm font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                  {selected.title || 'Untitled place'}
                </h3>
                <button onClick={() => setSelected(null)} className="p-0.5 text-stone-400 hover:text-stone-600 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(selected.location_name || selected.location_address) && (
                <p className="text-xs text-stone-500 dark:text-stone-400 flex items-start gap-1 mb-2">
                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{selected.location_name || selected.location_address}</span>
                </p>
              )}

              {selected.description && (
                <p className="text-xs text-stone-400 mb-2 line-clamp-2">{selected.description}</p>
              )}

              {selected.personal_notes && (
                <p className="text-xs italic text-stone-500 mb-2 line-clamp-2 border-l-2 border-stone-200 dark:border-stone-700 pl-2">
                  {selected.personal_notes}
                </p>
              )}

              {selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {selected.tags.map(tag => (
                    <span key={tag.id} className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1 pt-2 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => toggleFavorite(selected.id, selected.is_favorite)}
                  className={cn('flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs transition-colors',
                    selected.is_favorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-stone-400 hover:text-amber-500 hover:bg-stone-50 dark:hover:bg-stone-800'
                  )}
                >
                  <Star className={cn('w-3.5 h-3.5', selected.is_favorite && 'fill-amber-500')} />
                  {selected.is_favorite ? 'Saved' : 'Save'}
                </button>
                <button
                  onClick={() => onItemSelect(selected.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Details
                </button>
                {selected.url && (
                  <a href={selected.url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-stone-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Open
                  </a>
                )}
                <button
                  onClick={() => handleDelete(selected)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
