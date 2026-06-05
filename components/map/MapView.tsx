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

const CARTO_TILE = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const CARTO_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if (window.L) { resolve(window.L); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WPeE=';
    script.crossOrigin = '';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

function makeIcon(L: any, color: string, isFavorite: boolean) {
  return L.divIcon({
    className: '',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -46],
    html: `
      <div style="position:relative;width:36px;height:44px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3))">
        <svg viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
          <path d="M18 2C10.27 2 4 8.27 4 16c0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
            fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="18" cy="16" r="6" fill="white" opacity="0.9"/>
          ${isFavorite ? `<text x="18" y="20" text-anchor="middle" font-size="8" fill="${color}">★</text>` : `<circle cx="18" cy="16" r="3" fill="${color}"/>`}
        </svg>
      </div>`,
  });
}

export default function MapView({ items, onItemSelect }: MapViewProps) {
  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const { toggleFavorite, deleteItem } = useApp();
  const [selected, setSelected] = useState<ItemWithTags | null>(null);
  const [ready, setReady] = useState(false);

  const places = items.filter(i => i.latitude != null && i.longitude != null);

  // Init map once
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    let destroyed = false;

    loadLeaflet().then((L) => {
      if (destroyed || !mapElRef.current || mapRef.current) return;

      const map = L.map(mapElRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([48.8566, 2.3522], 3);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer(CARTO_TILE, {
        attribution: CARTO_ATTR,
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when places change
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const L = window.L;
    if (!L) return;
    const map = mapRef.current;

    // Remove old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (places.length === 0) return;

    const newMarkers = places.map(place => {
      const color = place.tags[0]?.color || '#0ea5e9';
      const icon = makeIcon(L, color, place.is_favorite);
      const marker = L.marker([place.latitude!, place.longitude!], { icon });

      marker.on('click', () => {
        setSelected(place);
        map.panTo([place.latitude!, place.longitude!], { animate: true, duration: 0.5 });
      });

      marker.addTo(map);
      return marker;
    });

    markersRef.current = newMarkers;

    // Fit bounds to show all markers
    const coords = places.map(p => [p.latitude!, p.longitude!] as [number, number]);
    if (coords.length === 1) {
      map.setView(coords[0], 13, { animate: true });
    } else {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: true });
    }
  }, [ready, places.length, places.map(p => p.id).join(',')]);

  const handleDelete = async (item: ItemWithTags) => {
    await deleteItem(item.id);
    setSelected(null);
  };

  return (
    <div className="relative w-full h-full" style={{ minHeight: 0 }}>
      {/* Map container — must have explicit height */}
      <div ref={mapElRef} className="absolute inset-0" />

      {/* Empty state */}
      {places.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-50/90 dark:bg-stone-900/90 z-[500]">
          <div className="text-center space-y-3 p-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-stone-400" />
            </div>
            <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">No places on the map</h3>
            <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
              Add items with type &quot;Place&quot; and pick a location — they&apos;ll appear here as pins.
            </p>
          </div>
        </div>
      )}

      {/* Count badge */}
      {places.length > 0 && (
        <div className="absolute top-3 left-3 z-[500] bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 text-xs font-medium px-3 py-1.5 rounded-full shadow-md border border-stone-200 dark:border-stone-700 flex items-center gap-1.5">
          <Navigation className="w-3 h-3" />
          {places.length} {places.length === 1 ? 'place' : 'places'}
        </div>
      )}

      {/* Selected place card */}
      {selected && (
        <div className="absolute bottom-5 left-3 right-3 md:left-auto md:right-5 md:w-80 z-[500]">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            {selected.preview_image_url && (
              <div className="h-32 w-full overflow-hidden">
                <img
                  src={selected.preview_image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                />
              </div>
            )}
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-50 leading-snug">
                  {selected.title || 'Untitled place'}
                </h3>
                <button
                  onClick={() => setSelected(null)}
                  className="p-0.5 rounded text-stone-400 hover:text-stone-600 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {(selected.location_name || selected.location_address) && (
                <div className="flex items-start gap-1 mb-2">
                  <MapPin className="w-3 h-3 text-stone-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                    {selected.location_name || selected.location_address}
                  </p>
                </div>
              )}

              {selected.description && (
                <p className="text-xs text-stone-400 dark:text-stone-500 mb-2 line-clamp-2">
                  {selected.description}
                </p>
              )}

              {selected.personal_notes && (
                <p className="text-xs text-stone-500 dark:text-stone-400 italic mb-2 line-clamp-2 border-l-2 border-stone-200 dark:border-stone-700 pl-2">
                  {selected.personal_notes}
                </p>
              )}

              {selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selected.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1 pt-1 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => toggleFavorite(selected.id, selected.is_favorite)}
                  className={cn('p-1.5 rounded-lg transition-colors flex-1 flex items-center justify-center gap-1 text-xs',
                    selected.is_favorite
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'text-stone-400 hover:text-amber-500 hover:bg-stone-50 dark:hover:bg-stone-800'
                  )}
                >
                  <Star className={cn('w-3.5 h-3.5', selected.is_favorite && 'fill-amber-500')} />
                  {selected.is_favorite ? 'Saved' : 'Favorite'}
                </button>
                <button
                  onClick={() => onItemSelect(selected.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex-1 flex items-center justify-center gap-1 text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Details
                </button>
                {selected.url && (
                  <a
                    href={selected.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors flex-1 flex items-center justify-center gap-1 text-xs"
                  >
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
