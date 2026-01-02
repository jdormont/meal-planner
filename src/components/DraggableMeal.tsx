import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

type DraggableMealProps = {
    id: string;
    children: React.ReactNode;
};

export function DraggableMeal({ id, children }: DraggableMealProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 100 : undefined,
        opacity: isDragging ? 0.8 : 1,
        position: isDragging ? 'relative' as const : undefined,
        touchAction: 'none', // Critical for mobile drag
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
}
