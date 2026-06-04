'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import type { ItemWithTags } from '@/lib/database.types';
import { MapPin, X, Star, Edit3, Check, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapViewProps {
  items: ItemWithTags[];
  onItemSelect: (id: string) => void;
}

export default function MapView({ items, onItemSelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const { updateItem, deleteItem, toggleFavorite } = useApp();
  const [selectedPlace, setSelectedPlace] = useState<ItemWithTags | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [mapReady, setMapReady] = useState(false);

  const places = items.filter(i => i.latitude !== null && i.longitude !== null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let map: any;

    // Load Leaflet CSS
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkEl);

    // Load Leaflet JS
    const scriptEl = document.createElement('script');
    scriptEl.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    scriptEl.onload = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([48.8566, 2.3522], 4);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setMapReady(true);
    };
    document.head.appendChild(scriptEl);

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current || !mapReady) return;

    const L = (window as any).L;
    if (!L) return;

    markersRef.current.clearLayers();

    places.forEach(place => {
      const color = place.tags[0]?.color || '#EF4444';
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center">
          <svg xmlns="http://www.w3.org/2000/svg" style="transform:rotate(45deg);width:14px;height:14px;color:white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const marker = L.marker([place.latitude!, place.longitude!], { icon: customIcon });
      marker.on('click', () => setSelectedPlace(place));
      markersRef.current!.addLayer(marker);
    });

    if (places.length > 0) {
      const bounds = L.latLngBounds(places.map(p => [p.latitude!, p.longitude!] as [number, number]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [places, mapReady]);

  const saveField = async (field: string) => {
    if (!selectedPlace) return;
    await updateItem(selectedPlace.id, { [field]: editValue });
    setSelectedPlace({ ...selectedPlace, [field]: editValue });
    setEditingField(null);
  };

  const handleDelete = async () => {
    if (!selectedPlace) return;
    await deleteItem(selectedPlace.id);
    setSelectedPlace(null);
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {places.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-50/80 dark:bg-stone-900/80 z-[1000]">
          <div className="text-center space-y-3 p-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-stone-400" />
            </div>
            <h3 className="text-sm font-medium text-stone-600 dark:text-stone-300">No places saved yet</h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-xs">
              Add items with a &quot;place&quot; type and location to see them on this map.
            </p>
          </div>
        </div>
      )}

      {selectedPlace && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000] bg-white dark:bg-stone-900 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Place</span>
              {selectedPlace.is_favorite && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleFavorite(selectedPlace.id, selectedPlace.is_favorite)} className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800">
                <Star className={cn('w-3.5 h-3.5', selectedPlace.is_favorite ? 'fill-amber-500 text-amber-500' : 'text-stone-400')} />
              </button>
              <button onClick={handleDelete} className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onItemSelect(selectedPlace.id)} className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setSelectedPlace(null)} className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 space-y-2 max-h-60 overflow-y-auto">
            <div>
              {editingField === 'title' ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveField('title'); if (e.key === 'Escape') setEditingField(null); }}
                    className="flex-1 text-sm font-medium bg-stone-50 dark:bg-stone-800 rounded px-1.5 py-0.5 outline-none"
                  />
                  <button onClick={() => saveField('title')} className="p-0.5 text-stone-500 hover:text-stone-700"><Check className="w-3 h-3" /></button>
                </div>
              ) : (
                <div className="group flex items-center gap-1 cursor-pointer" onClick={() => { setEditingField('title'); setEditValue(selectedPlace.title); }}>
                  <h4 className="text-sm font-medium text-stone-900 dark:text-stone-50 flex-1 truncate">{selectedPlace.title || 'Untitled'}</h4>
                  <Edit3 className="w-3 h-3 text-stone-300 opacity-0 group-hover:opacity-100" />
                </div>
              )}
            </div>

            <div>
              {editingField === 'location_name' ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveField('location_name'); if (e.key === 'Escape') setEditingField(null); }}
                    className="flex-1 text-xs bg-stone-50 dark:bg-stone-800 rounded px-1.5 py-0.5 outline-none"
                    placeholder="Location name..."
                  />
                  <button onClick={() => saveField('location_name')} className="p-0.5 text-stone-500"><Check className="w-3 h-3" /></button>
                </div>
              ) : (
                <div className="group flex items-center gap-1 cursor-pointer" onClick={() => { setEditingField('location_name'); setEditValue(selectedPlace.location_name || ''); }}>
                  <MapPin className="w-3 h-3 text-stone-400 flex-shrink-0" />
                  <span className="text-xs text-stone-500 dark:text-stone-400 flex-1 truncate">
                    {selectedPlace.location_name || selectedPlace.location_address || 'Add location name...'}
                  </span>
                  <Edit3 className="w-2.5 h-2.5 text-stone-300 opacity-0 group-hover:opacity-100" />
                </div>
              )}
            </div>

            {editingField === 'description' ? (
              <div className="flex items-start gap-1">
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) saveField('description'); }}
                  className="flex-1 text-xs bg-stone-50 dark:bg-stone-800 rounded px-1.5 py-0.5 outline-none resize-none min-h-[40px]"
                  placeholder="Description..."
                />
                <button onClick={() => saveField('description')} className="p-0.5 text-stone-500"><Check className="w-3 h-3" /></button>
              </div>
            ) : (
              <div className="group cursor-pointer" onClick={() => { setEditingField('description'); setEditValue(selectedPlace.description || ''); }}>
                <p className="text-xs text-stone-400 line-clamp-2">{selectedPlace.description || 'Add description...'}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {selectedPlace.tags.map(tag => (
                <span key={tag.id} className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>{tag.name}</span>
              ))}
            </div>

            {selectedPlace.personal_notes && (
              <p className="text-xs text-stone-400 line-clamp-2 border-t border-stone-100 dark:border-stone-800 pt-1.5">{selectedPlace.personal_notes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
