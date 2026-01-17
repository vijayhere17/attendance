import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface LocationMapProps {
    latitude: number;
    longitude: number;
    radius?: number;
    className?: string;
}

export function LocationMap({ latitude, longitude, radius = 100, className = "" }: LocationMapProps) {
    // Calculate bounding box for the map embed
    // 0.01 degrees is roughly 1km
    const bbox = [
        longitude - 0.005,
        latitude - 0.005,
        longitude + 0.005,
        latitude + 0.005
    ].join(',');

    return (
        <Card className={`overflow-hidden relative group ${className} border-border/50 shadow-soft`}>
            <div className="absolute inset-0 bg-muted/20 z-0">
                <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`}
                    className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500 grayscale group-hover:grayscale-0"
                />
            </div>

            {/* Overlay for interaction hint */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="bg-background/80 backdrop-blur-sm p-3 rounded-full shadow-lg transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                    <MapPin className="w-6 h-6 text-primary animate-bounce" />
                </div>
            </div>

            {/* Radius indicator (visual only, approximate) */}
            <div className="absolute top-4 right-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-border/50 z-10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Geofence Active: {radius}m
            </div>
        </Card>
    );
}
