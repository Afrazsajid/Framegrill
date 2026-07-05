'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, X, ChevronRight, Loader2, Navigation, Flame,
  Crosshair, Search, AlertCircle, CheckCircle2, LocateFixed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAreaStore, type DeliveryArea, type OrderType } from '@/store/area-store';
import { findMatchingArea, reverseGeocode } from '@/lib/geo';

const HERO_BG = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop';

/* ----------------------------------------------------------------
   Location detection states
   ---------------------------------------------------------------- */
type LocationStatus =
  | 'idle'          // not started
  | 'detecting'     // GPS in progress
  | 'detected'      // GPS succeeded, area matched
  | 'no_match'      // GPS succeeded, but outside all areas
  | 'denied'        // user blocked location permission
  | 'unavailable'   // geolocation not supported
  | 'error';        // other error (timeout, etc.)

/* ================================================================
   OrderTypeToggle
   ================================================================ */
function OrderTypeToggle({ value, onChange }: { value: OrderType; onChange: (t: OrderType) => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-border/60 bg-muted/40">
      {(['delivery', 'pickup'] as const).map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`flex-1 py-3 px-6 text-sm font-semibold transition-all duration-200 relative ${
            value === type ? 'text-background' : 'text-muted-foreground hover:text-foreground/70'
          }`}
        >
          {value === type && (
            <motion.div
              layoutId="order-type-pill"
              className="absolute inset-0 bg-foreground rounded-md"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />
          )}
          <span className="relative z-10">
            {type === 'delivery' ? 'Delivery' : 'Pick-Up'}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ================================================================
   LocationDetecting — spinning radar animation
   ================================================================ */
function LocationDetecting() {
  return (
    <div className="flex flex-col items-center justify-center py-5 gap-2.5">
      <div className="relative">
        <div className="size-12 rounded-full border-2 border-border flex items-center justify-center">
          <Navigation className="size-4 text-muted-foreground animate-pulse" />
        </div>
        <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">Getting your location...</p>
    </div>
  );
}

/* ================================================================
   LocationMatched — shows detected area with green check
   ================================================================ */
function LocationMatched({
  areaName,
  userAddress,
}: {
  areaName: string;
  userAddress: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-primary/[0.06] border border-primary/20"
    >
      <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 shrink-0">
        <LocateFixed className="size-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
          <CheckCircle2 className="size-3" />
          Location detected
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {userAddress ?? areaName} — {areaName}
        </p>
      </div>
    </motion.div>
  );
}

/* ================================================================
   LocationError — shows permission / error message
   ================================================================ */
function LocationError({
  status,
  onRetry,
}: {
  status: 'denied' | 'unavailable' | 'error' | 'no_match';
  onRetry: () => void;
}) {
  const messages: Record<typeof status, string> = {
    denied: 'Location access was denied. Please select your area manually.',
    unavailable: 'Geolocation is not available in your browser. Please select manually.',
    error: 'Could not get your location. Please select your area manually.',
    no_match: "You're outside our delivery zones. Please select the nearest area.",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20"
    >
      <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/10 shrink-0 mt-0.5">
        <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          {status === 'denied' ? 'Location blocked' : status === 'no_match' ? 'Outside delivery zones' : 'Location unavailable'}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{messages[status]}</p>
        {(status === 'denied' || status === 'error') && (
          <button
            onClick={onRetry}
            className="mt-1.5 text-[11px] font-semibold text-primary hover:underline"
          >
            Try again
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ================================================================
   SearchInput — debounced area search
   ================================================================ */
function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search area..."
        aria-label="Search delivery areas"
        className="w-full h-9 pl-9 pr-9 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
      />
      {value && (
        <button
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
          aria-label="Clear search"
        >
          <X className="size-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

/* ================================================================
   AreaListItem
   ================================================================ */
function AreaListItem({
  area, isSelected, onClick, index, autoDetected,
}: {
  area: DeliveryArea;
  isSelected: boolean;
  onClick: () => void;
  index: number;
  autoDetected?: boolean;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 p-3.5 rounded-xl border-2 text-left transition-all duration-200 group ${
        isSelected
          ? 'border-primary bg-primary/[0.04] shadow-sm'
          : 'border-transparent bg-muted/30 hover:bg-muted/60 hover:border-border/60'
      }`}
    >
      <div
        className={`flex items-center justify-center size-9 rounded-lg shrink-0 transition-colors duration-200 ${
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-muted-foreground group-hover:text-foreground'
        }`}
      >
        <MapPin className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          {area.name}
          {autoDetected && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="size-2.5" /> YOUR AREA
            </span>
          )}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {isSelected ? 'Selected' : 'Delivery Available'}
        </p>
      </div>
      {isSelected ? (
        <span className="text-xs font-bold text-primary shrink-0">Selected</span>
      ) : (
        <ChevronRight className="size-4 text-muted-foreground/30 shrink-0 group-hover:text-muted-foreground/60 transition-colors" />
      )}
    </motion.button>
  );
}

/* ================================================================
   EmptySearchResult
   ================================================================ */
function EmptySearchResult({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <Search className="size-8 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">No areas match &ldquo;{query}&rdquo;</p>
      <p className="text-[11px] text-muted-foreground/60">Try a different search term</p>
    </div>
  );
}

/* ================================================================
   AreaModal — rendered via portal at document.body
   ================================================================ */
export function AreaModal() {
  const {
    selectedArea, orderType, hasSelected, isModalOpen,
    completeSelection, closeModal,
  } = useAreaStore();

  /* ---- state ---- */
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);
  const [localOrderType, setLocalOrderType] = useState<OrderType>(orderType);
  const [preSelectedArea, setPreSelectedArea] = useState<DeliveryArea | null>(null);
  const [mounted, setMounted] = useState(false);

  // GPS / location
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [autoDetectedAreaId, setAutoDetectedAreaId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  /* ---- portal needs DOM ---- */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---- fetch areas ---- */
  const fetchAreas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery-areas');
      const data = await res.json();
      if (Array.isArray(data)) {
        const active = data.filter((a: DeliveryArea) => a.isActive);
        setAreas(active);
        // Invalidate stale selection
        if (selectedArea && selectedArea.id !== 'pickup') {
          if (!active.find((a) => a.id === selectedArea.id)) {
            useAreaStore.setState({ selectedArea: null, hasSelected: false });
          }
        }
      }
    } catch { /* silent */ } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [selectedArea]);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  /* ---- GPS detection ---- */
  const detectLocation = useCallback(async (areaList: DeliveryArea[]) => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unavailable');
      return;
    }

    setLocationStatus('detecting');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,   // 10 s
          maximumAge: 60_000, // cache for 1 min
        });
      });

      const { latitude: userLat, longitude: userLng } = position.coords;

      // Reverse geocode in parallel (non-blocking, graceful fallback)
      reverseGeocode(userLat, userLng).then(setUserAddress).catch(() => {});

      // Match against delivery areas
      const matched = findMatchingArea(userLat, userLng, areaList);

      if (matched) {
        setPreSelectedArea(matched);
        setAutoDetectedAreaId(matched.id);
        setLocationStatus('detected');
      } else {
        setLocationStatus('no_match');
      }
    } catch (err) {
      const geoErr = err as GeolocationPositionError;
      if (geoErr?.code === 1) {
        setLocationStatus('denied');
      } else {
        setLocationStatus('error');
      }
    }
  }, []);

  // Trigger detection once areas are loaded (first visit, no prior selection)
  useEffect(() => {
    if (fetched && areas.length > 0 && locationStatus === 'idle') {
      detectLocation(areas);
    }
  }, [fetched, areas, locationStatus, detectLocation]);

  // When switching back to delivery, re-detect if idle
  useEffect(() => {
    if (localOrderType === 'delivery' && locationStatus === 'idle' && areas.length > 0) {
      detectLocation(areas);
    }
  }, [localOrderType, locationStatus, areas, detectLocation]);

  /* ---- auto-open first visit ---- */
  useEffect(() => {
    if (fetched && !hasSelected && areas.length > 0 && !isModalOpen) {
      useAreaStore.getState().openModal();
    }
  }, [fetched, hasSelected, areas.length, isModalOpen]);

  /* ---- re-fetch when modal opens empty ---- */
  useEffect(() => {
    if (isModalOpen && areas.length === 0) fetchAreas();
  }, [isModalOpen, areas.length, fetchAreas]);

  /* ---- sync on open ---- */
  useEffect(() => {
    if (isModalOpen) {
      setLocalOrderType(orderType);
      setPreSelectedArea(selectedArea);
      setSearchQuery('');
    }
  }, [isModalOpen, orderType, selectedArea]);

  /* ---- filtered areas ---- */
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areas;
    const q = searchQuery.toLowerCase().trim();
    return areas.filter((a) => a.name.toLowerCase().includes(q));
  }, [areas, searchQuery]);

  /* ---- handlers ---- */
  const handleConfirm = () => {
    if (localOrderType === 'pickup') {
      completeSelection(
        { id: 'pickup', name: 'Pick-up', slug: 'pickup', isActive: true, sortOrder: 0, latitude: null, longitude: null, radiusKm: 0 },
        'pickup',
      );
    } else if (preSelectedArea) {
      completeSelection(preSelectedArea, localOrderType);
    }
  };

  const canConfirm =
    localOrderType === 'pickup' ||
    (preSelectedArea !== null && preSelectedArea.id !== 'pickup');

  /* ---- render ---- */
  if (!mounted || !isModalOpen) return null;

  const modal = (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={hasSelected ? closeModal : undefined}
        >
          {/* Blurred dark background */}
          <div className="absolute inset-0 overflow-hidden">
            <img src={HERO_BG} alt="" className="w-full h-full object-cover scale-110 blur-md" />
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
          </div>

          {/* ===== Modal — perfectly centred on screen ===== */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="relative z-10 bg-background rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dark header bar with logo */}
            <div className="bg-foreground flex items-center justify-center py-4 px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center size-9 rounded-full bg-primary text-primary-foreground shadow-md">
                  <Flame className="size-5" />
                </div>
                <span className="text-base font-bold text-background">FlameGrill</span>
              </div>
            </div>

            {/* Close button — only on re-open */}
            {hasSelected && (
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-background/80 hover:bg-background transition-colors shadow-sm"
                aria-label="Close"
              >
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}

            {/* Body */}
            <div className="px-6 pt-5 pb-6">
              <h2 className="text-lg font-bold text-center mb-4">Select Your Order Type</h2>
              <OrderTypeToggle value={localOrderType} onChange={setLocalOrderType} />

              {localOrderType === 'delivery' && (
                <div className="mt-5">
                  {/* --- Location status section --- */}
                  {locationStatus === 'detecting' && <LocationDetecting />}

                  {locationStatus === 'detected' && preSelectedArea && (
                    <LocationMatched
                      areaName={preSelectedArea.name}
                      userAddress={userAddress}
                    />
                  )}

                  {(locationStatus === 'denied' ||
                    locationStatus === 'unavailable' ||
                    locationStatus === 'error' ||
                    locationStatus === 'no_match') && (
                    <LocationError
                      status={locationStatus}
                      onRetry={() => {
                        setLocationStatus('idle');
                        detectLocation(areas);
                      }}
                    />
                  )}

                  {/* Spacer between detection result and area list */}
                  {locationStatus !== 'detecting' && (
                    <div className="mt-4" />
                  )}

                  {/* --- Search input (shown when location detection is done) --- */}
                  {locationStatus !== 'detecting' && (
                    <>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                        Select Your Delivery Area
                      </label>

                      <div className="mb-3">
                        <SearchInput value={searchQuery} onChange={setSearchQuery} />
                      </div>
                    </>
                  )}

                  {/* --- Area list --- */}
                  {locationStatus !== 'detecting' &&
                    (loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-5 animate-spin text-primary" />
                      </div>
                    ) : filteredAreas.length === 0 ? (
                      <EmptySearchResult query={searchQuery} />
                    ) : (
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                        {filteredAreas.map((area, i) => (
                          <AreaListItem
                            key={area.id}
                            area={area}
                            isSelected={preSelectedArea?.id === area.id}
                            onClick={() => setPreSelectedArea(area)}
                            index={i}
                            autoDetected={autoDetectedAreaId === area.id}
                          />
                        ))}
                      </div>
                    ))}

                  {/* --- Manual "Use Current Location" button (fallback / retry) --- */}
                  {locationStatus !== 'detecting' && (
                    <button
                      onClick={() => {
                        setAutoDetectedAreaId(null);
                        setLocationStatus('idle');
                        detectLocation(areas);
                      }}
                      disabled={locationStatus === 'detecting'}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-muted/60 transition-colors mt-3 disabled:opacity-50"
                    >
                      <Crosshair className="size-4 text-muted-foreground" />
                      {locationStatus === 'detecting'
                        ? 'Detecting...'
                        : 'Use Current Location'}
                    </button>
                  )}
                </div>
              )}

              {localOrderType === 'pickup' && (
                <div className="mt-5 py-4 text-center">
                  <div className="flex items-center justify-center size-11 rounded-full bg-muted mx-auto mb-2.5">
                    <MapPin className="size-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">Pick-up from our restaurant</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    123 Main Street, Downtown, NY 10001
                  </p>
                </div>
              )}

              {/* --- Confirm button (hide while detecting) --- */}
              {locationStatus !== 'detecting' && (
                <Button
                  className="w-full mt-4 rounded-xl h-11 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!canConfirm}
                  onClick={handleConfirm}
                >
                  Confirm Selection
                </Button>
              )}

              {!hasSelected && areas.length > 0 && locationStatus !== 'detecting' && (
                <p className="text-[10px] text-center text-muted-foreground/60 mt-3">
                  You can change your selection anytime from the header
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
