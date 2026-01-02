import React from 'react';
import { useDroppable } from '@dnd-kit/core';

type DroppableSlotProps = {
    id: string;
    children: React.ReactNode;
    active?: boolean;
};

export function DroppableSlot({ id, children, active }: DroppableSlotProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    const style = {
        backgroundColor: isOver ? 'rgba(230, 115, 90, 0.1)' : undefined,
        transition: 'background-color 0.2s ease',
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full w-full">
            {children}
        </div>
    );
}
