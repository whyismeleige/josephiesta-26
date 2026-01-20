"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, Plus, X } from "lucide-react";
import { FormField } from "./types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SortableFieldProps {
  field: FormField;
  onUpdate: (id: string, updates: Partial<FormField>) => void;
  onDelete: (id: string) => void;
  isActive: boolean; // If true, show edit controls. If false, look like a preview.
  onActivate: () => void;
}

export function SortableField({ field, onUpdate, onDelete, isActive, onActivate }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Helper to update specific properties
  const update = (key: keyof FormField, value: any) => {
    onUpdate(field.id, { [key]: value });
  };

  // Helper for options (Radio/Checkbox/Dropdown)
  const addOption = () => {
    const currentOptions = field.options || [];
    update("options", [...currentOptions, `Option ${currentOptions.length + 1}`]);
  };

  const updateOption = (index: number, val: string) => {
    const newOptions = [...(field.options || [])];
    newOptions[index] = val;
    update("options", newOptions);
  };

  const removeOption = (index: number) => {
    const newOptions = [...(field.options || [])];
    newOptions.splice(index, 1);
    update("options", newOptions);
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4 relative group">
      {/* Visual Indicator for Active State */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-md transition-colors ${isActive ? 'bg-purple-600' : 'bg-transparent group-hover:bg-zinc-200'}`} />

      <Card 
        onClick={onActivate}
        className={`border transition-all ${isActive ? 'ring-2 ring-purple-100 border-purple-300 shadow-md' : 'hover:border-zinc-400'}`}
      >
        <CardHeader className="p-4 pb-2 flex flex-row items-start gap-4 space-y-0">
          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="mt-2 cursor-move text-zinc-400 hover:text-zinc-600">
            <GripVertical size={20} />
          </div>

          <div className="flex-1 space-y-4">
            {isActive ? (
              // --- EDIT MODE ---
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-1">
                  <Label>Field Label</Label>
                  <Input 
                    value={field.label} 
                    onChange={(e) => update("label", e.target.value)} 
                    placeholder="Question Title"
                    className="font-medium text-lg"
                  />
                </div>
                
                <div className="space-y-2 col-span-1 md:col-span-1">
                  <Label>Field Type</Label>
                   <Select 
                      value={field.type} 
                      onValueChange={(val) => update("type", val)}
                   >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Short Answer</SelectItem>
                      <SelectItem value="textarea">Paragraph</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="dropdown">Dropdown</SelectItem>
                      <SelectItem value="radio">Multiple Choice</SelectItem>
                      <SelectItem value="checkbox">Checkboxes</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="time">Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Description / Help Text */}
                <div className="col-span-full">
                   <Input 
                    value={field.placeholder || ""} 
                    onChange={(e) => update("placeholder", e.target.value)} 
                    placeholder="Placeholder text (what the user sees inside the box)"
                    className="text-sm text-muted-foreground"
                  />
                </div>
              </div>
            ) : (
              // --- PREVIEW MODE ---
              <div className="py-2">
                <h3 className="font-medium text-lg flex gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </h3>
                {field.placeholder && <p className="text-sm text-zinc-500">{field.placeholder}</p>}
                
                {/* Mock Input View */}
                <div className="mt-3 pointer-events-none opacity-60">
                  {['text', 'email', 'phone', 'date', 'time'].includes(field.type) && <Input disabled placeholder="Answer" />}
                  {field.type === 'textarea' && <Textarea disabled placeholder="Long answer text" />}
                  {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
                     <div className="space-y-2">
                        {field.options?.map((opt, i) => (
                           <div key={i} className="flex items-center gap-2">
                              <div className={`h-4 w-4 border ${field.type === 'radio' ? 'rounded-full' : field.type === 'checkbox' ? 'rounded' : ''}`} />
                              <span className="text-sm">{opt}</span>
                           </div>
                        ))}
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        {isActive && (
          <CardContent className="p-4 pt-0">
             {/* Options Builder for Select/Radio/Checkbox */}
             {['dropdown', 'radio', 'checkbox'].includes(field.type) && (
               <div className="pl-9 mb-6 space-y-2">
                 <Label className="text-xs uppercase text-zinc-500 tracking-wider">Options</Label>
                 {field.options?.map((opt, index) => (
                   <div key={index} className="flex items-center gap-2">
                     <div className="h-3 w-3 border border-zinc-300" />
                     <Input 
                        value={opt} 
                        onChange={(e) => updateOption(index, e.target.value)}
                        className="h-8 text-sm"
                     />
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500" onClick={() => removeOption(index)}>
                       <X size={14} />
                     </Button>
                   </div>
                 ))}
                 <Button variant="outline" size="sm" onClick={addOption} className="mt-2 text-xs">
                   <Plus size={12} className="mr-1" /> Add Option
                 </Button>
               </div>
             )}

            <div className="border-t pt-4 flex items-center justify-end gap-4">
              <div className="flex items-center gap-2 border-r pr-4">
                <Label htmlFor={`req-${field.id}`} className="cursor-pointer text-sm">Required</Label>
                <Switch 
                  id={`req-${field.id}`}
                  checked={field.required}
                  onCheckedChange={(checked) => update("required", checked)}
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-zinc-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(field.id)}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}