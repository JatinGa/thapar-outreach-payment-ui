'use client';

import { useState } from 'react';
import { Event } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface EventFormProps {
  event?: Event;
  onSubmit: (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function EventForm({ event, onSubmit, onCancel }: EventFormProps) {
  const [name, setName] = useState(event?.name || '');
  const [eventDates, setEventDates] = useState(event?.eventDates || '');
  const [outsideDescription, setOutsideDescription] = useState(event?.outsideDescription || '');
  const [insideDescription, setInsideDescription] = useState(event?.insideDescription || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Event name is required';
    if (!eventDates.trim()) newErrors.eventDates = 'Event dates are required';
    if (!outsideDescription.trim()) newErrors.outsideDescription = 'Outside description is required';
    if (!insideDescription.trim()) newErrors.insideDescription = 'Inside description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      name,
      eventDates,
      outsideDescription,
      insideDescription,
      accommodationOptions: event?.accommodationOptions || [],
    });

    // Reset form
    setName('');
    setEventDates('');
    setOutsideDescription('');
    setInsideDescription('');
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 md:p-8 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Event Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Event Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="e.g., Helix, TechFest"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Event Dates */}
        <div>
          <label htmlFor="eventDates" className="block text-sm font-medium text-foreground mb-2">
            Event Dates
          </label>
          <Input
            id="eventDates"
            type="text"
            placeholder="e.g., 17–19 April"
            value={eventDates}
            onChange={(e) => setEventDates(e.target.value)}
            className={errors.eventDates ? 'border-red-500' : ''}
          />
          {errors.eventDates && <p className="text-sm text-red-500 mt-1">{errors.eventDates}</p>}
        </div>
      </div>

      {/* Outside Description */}
      <div className="mb-6">
        <label htmlFor="outsideDescription" className="block text-sm font-medium text-foreground mb-2">
          Outside Description (Event Card)
        </label>
        <Textarea
          id="outsideDescription"
          placeholder="Shown on event card before user opens the event..."
          value={outsideDescription}
          onChange={(e) => setOutsideDescription(e.target.value)}
          rows={3}
          className={errors.outsideDescription ? 'border-red-500' : ''}
        />
        {errors.outsideDescription && <p className="text-sm text-red-500 mt-1">{errors.outsideDescription}</p>}
      </div>

      {/* Inside Description */}
      <div className="mb-8">
        <label htmlFor="insideDescription" className="block text-sm font-medium text-foreground mb-2">
          Inside Description (Accommodation Screen)
        </label>
        <Textarea
          id="insideDescription"
          placeholder="Shown after event is selected, above accommodation options..."
          value={insideDescription}
          onChange={(e) => setInsideDescription(e.target.value)}
          rows={4}
          className={errors.insideDescription ? 'border-red-500' : ''}
        />
        {errors.insideDescription && <p className="text-sm text-red-500 mt-1">{errors.insideDescription}</p>}
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="px-6 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {event ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}
