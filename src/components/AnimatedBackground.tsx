import { useEffect, useState } from 'react';

export function AnimatedBackground() {
    const [shapes, setShapes] = useState<Array<{
        id: number;
        size: number;
        x: number;
        y: number;
        duration: number;
        delay: number;
        color: string;
        shape: 'circle' | 'square' | 'triangle';
    }>>([]);

    useEffect(() => {
        const colors = [
            'hsl(14 90% 60% / 0.1)',
            'hsl(174 62% 47% / 0.1)',
            'hsl(142 76% 36% / 0.1)',
            'hsl(38 92% 50% / 0.1)',
            'hsl(262 83% 58% / 0.1)',
        ];

        const shapeTypes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];

        const newShapes = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            size: Math.random() * 200 + 50,
            x: Math.random() * 100,
            y: Math.random() * 100,
            duration: Math.random() * 20 + 15,
            delay: Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        }));

        setShapes(newShapes);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
            {shapes.map((shape) => (
                <div
                    key={shape.id}
                    className="absolute animate-float"
                    style={{
                        left: `${shape.x}%`,
                        top: `${shape.y}%`,
                        width: `${shape.size}px`,
                        height: `${shape.size}px`,
                        animationDuration: `${shape.duration}s`,
                        animationDelay: `${shape.delay}s`,
                    }}
                >
                    {shape.shape === 'circle' && (
                        <div
                            className="w-full h-full rounded-full blur-3xl"
                            style={{ backgroundColor: shape.color }}
                        />
                    )}
                    {shape.shape === 'square' && (
                        <div
                            className="w-full h-full rotate-45 blur-3xl"
                            style={{ backgroundColor: shape.color }}
                        />
                    )}
                    {shape.shape === 'triangle' && (
                        <div
                            className="w-full h-full blur-3xl"
                            style={{
                                backgroundColor: shape.color,
                                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                            }}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
