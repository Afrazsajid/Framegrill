'use client';

import { MapPin, ChevronRight } from 'lucide-react';
import { useAreaStore } from '@/store/area-store';

/**
 * Compact area button shown in the header after user has selected an area.
 * The full modal is rendered separately via <AreaModal /> at the layout level
 * so that `fixed` positioning is relative to the viewport (not the header's
 * backdrop-blur containing block).
 */
export function AreaSelector() {
  const { selectedArea, isModalOpen, openModal } = useAreaStore();

  if (!selectedArea || isModalOpen) return null;

  const isPickup = selectedArea.id === 'pickup';

  return (
    <button
      onClick={openModal}
      className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mr-2 group"
    >
      <MapPin className="size-3.5 text-primary group-hover:scale-110 transition-transform" />
      <span className="max-w-[120px] truncate">
        {isPickup ? 'Pick-up' : selectedArea.name}
      </span>
      <ChevronRight className="size-3 opacity-50" />
    </button>
  );
}