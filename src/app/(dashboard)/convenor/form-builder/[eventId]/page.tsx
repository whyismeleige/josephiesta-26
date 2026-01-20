"use client";

import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableField } from "@/components/dashboard/form-builder/SortableField"; // The component above
import { FormField, FieldType } from "@/components/dashboard/form-builder/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock save function
const saveFormToBackend = async (eventId: string, fields: FormField[]) => {
    console.log("Saving to DB:", { eventId, fields });
    // Here you would call your Server Action or API
    // await fetch('/api/forms', { method: 'POST', body: JSON.stringify({ eventId, fields }) })
};

export default function FormBuilderPage({ params }: { params: { eventId: string } }) {
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [fields, setFields] = useState<FormField[]>([
    // Initial default field
    { id: uuidv4(), type: 'text', label: 'Full Name', required: true, order: 0 }
  ]);

  // Sensors for Drag and Drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // --- ACTIONS ---

  const addField = (type: FieldType = 'text') => {
    const newField: FormField = {
      id: uuidv4(),
      type,
      label: 'Untitled Question',
      required: false,
      order: fields.length,
      options: ['dropdown', 'radio', 'checkbox'].includes(type) ? ['Option 1'] : undefined
    };
    setFields([...fields, newField]);
    setActiveFieldId(newField.id); // Auto-focus the new field
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        // Update order property
        return reordered.map((f, idx) => ({ ...f, order: idx }));
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col md:flex-row bg-zinc-50">
      
      {/* LEFT: Canvas */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-white flex justify-between items-center sticky top-0 z-10">
            <div>
                <h1 className="text-xl font-bold">Registration Form</h1>
                <p className="text-sm text-zinc-500">Customize what students need to fill out</p>
            </div>
            <Button onClick={() => saveFormToBackend(params.eventId, fields)} className="bg-purple-600 hover:bg-purple-700">
                <Save className="mr-2 h-4 w-4" /> Save Form
            </Button>
        </div>

        <ScrollArea className="flex-1 p-4 md:p-8">
            <div className="max-w-3xl mx-auto pb-20">
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                        {fields.map((field) => (
                            <SortableField 
                                key={field.id} 
                                field={field} 
                                isActive={activeFieldId === field.id}
                                onActivate={() => setActiveFieldId(field.id)}
                                onUpdate={updateField}
                                onDelete={deleteField}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
                
                {fields.length === 0 && (
                    <div className="text-center py-20 text-zinc-400 border-2 border-dashed rounded-lg">
                        <p>No fields yet. Add one from the sidebar.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
      </div>

      {/* RIGHT: Toolbox Sidebar */}
      <div className="w-full md:w-80 border-l bg-white p-4 overflow-y-auto h-full shadow-sm">
        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-zinc-500">Add Fields</h3>
        <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" className="justify-start" onClick={() => addField('text')}>
                <PlusCircle className="mr-2 h-4 w-4 text-purple-600" /> Short Text
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => addField('textarea')}>
                <PlusCircle className="mr-2 h-4 w-4 text-purple-600" /> Long Text
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => addField('email')}>
                <PlusCircle className="mr-2 h-4 w-4 text-purple-600" /> Email
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => addField('phone')}>
                <PlusCircle className="mr-2 h-4 w-4 text-purple-600" /> Phone
            </Button>
            <div className="h-px bg-zinc-100 my-2" />
            <Button variant="outline" className="justify-start" onClick={() => addField('dropdown')}>
                <PlusCircle className="mr-2 h-4 w-4 text-blue-600" /> Dropdown
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => addField('radio')}>
                <PlusCircle className="mr-2 h-4 w-4 text-blue-600" /> Single Choice
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => addField('checkbox')}>
                <PlusCircle className="mr-2 h-4 w-4 text-blue-600" /> Checkboxes
            </Button>
            <div className="h-px bg-zinc-100 my-2" />
            <Button variant="outline" className="justify-start" onClick={() => addField('date')}>
                <PlusCircle className="mr-2 h-4 w-4 text-green-600" /> Date Picker
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => addField('time')}>
                <PlusCircle className="mr-2 h-4 w-4 text-green-600" /> Time Picker
            </Button>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-md border border-yellow-100">
            <h4 className="font-bold text-yellow-800 text-sm mb-1">Note</h4>
            <p className="text-xs text-yellow-700">
                Updating this form will not affect students who have already registered. New versions only apply to new signups.
            </p>
        </div>
      </div>
    </div>
  );
}