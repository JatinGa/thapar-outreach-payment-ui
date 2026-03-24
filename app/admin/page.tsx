'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { getEvents, deleteEvent, addEvent, Event, updateEvent, deleteAccommodationOption, addAccommodationOption, updateAccommodationOption, resetEventsToDefault, AccommodationOption } from '@/lib/events';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const EventForm = dynamic(() => import('@/components/admin/EventForm'), {
  loading: () => <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">Loading form...</div>,
});

const AccommodationForm = dynamic(() => import('@/components/admin/AccommodationForm'), {
  loading: () => <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">Loading form...</div>,
});

const AdminProtect = dynamic(() => import('@/components/admin/AdminProtect'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Loading...</p>
    </div>
  ),
});

function AdminPageContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAccommodationFormOpen, setIsAccommodationFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingAccommodation, setEditingAccommodation] = useState<AccommodationOption | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // Load events on mount
  useEffect(() => {
    try {
      setEvents(getEvents());
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEvent = addEvent(eventData);
    setEvents([...events, newEvent]);
    setIsFormOpen(false);
  };

  const handleUpdateEvent = (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingEvent) return;
    const updated = updateEvent(editingEvent.id, eventData);
    if (updated) {
      setEvents(events.map(e => e.id === editingEvent.id ? updated : e));
      setIsFormOpen(false);
      setEditingEvent(null);
    }
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      if (deleteEvent(id)) {
        setEvents(events.filter(e => e.id !== id));
        if (selectedEvent?.id === id) {
          setSelectedEvent(null);
        }
      }
    }
  };

  const handleDeleteAccommodation = (eventId: string, optionId: string) => {
    if (confirm('Are you sure you want to delete this accommodation option?')) {
      const updatedEvent = deleteAccommodationOption(eventId, optionId);
      if (!updatedEvent) return;

      setEvents(events.map((event) => (event.id === eventId ? updatedEvent : event)));
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(updatedEvent);
      }
    }
  };

  const handleAddAccommodation = (optionData: Omit<AccommodationOption, 'id'>) => {
    if (!selectedEvent) return;

    const updatedEvent = addAccommodationOption(selectedEvent.id, optionData);
    if (!updatedEvent) return;

    setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e));
    setSelectedEvent(updatedEvent);
    setIsAccommodationFormOpen(false);
    setEditingAccommodation(null);
  };

  const handleUpdateAccommodation = (optionData: Omit<AccommodationOption, 'id'>) => {
    if (!selectedEvent || !editingAccommodation) return;

    const updatedEvent = updateAccommodationOption(selectedEvent.id, editingAccommodation.id, optionData);
    if (!updatedEvent) return;

    setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e));
    setSelectedEvent(updatedEvent);
    setIsAccommodationFormOpen(false);
    setEditingAccommodation(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const handleResetEvents = () => {
    if (!confirm('This will replace current local events with default events. Continue?')) return;

    const defaults = resetEventsToDefault();
    setEvents(defaults);
    setSelectedEvent(null);
    setIsFormOpen(false);
    setIsAccommodationFormOpen(false);
    setEditingEvent(null);
    setEditingAccommodation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-primary/80 rounded-lg transition">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Portal</h1>
          </div>
          {!selectedEvent && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleResetEvents}
                className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Reset Events
              </Button>
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {!selectedEvent ? (
          <>
            {/* Events List View */}
            {isFormOpen && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-foreground">
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </h2>
                <EventForm
                  event={editingEvent || undefined}
                  onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}
                  onCancel={handleCloseForm}
                />
              </div>
            )}

            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Event Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Dates</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Options</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                          No events yet. Create one to get started.
                        </td>
                      </tr>
                    ) : (
                      events.map((event) => (
                        <tr key={event.id} className="border-b border-border hover:bg-muted/50 transition">
                          <td className="px-6 py-4 text-foreground font-medium">{event.name}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{event.eventDates}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {event.accommodationOptions.length} option{event.accommodationOptions.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedEvent(event)}
                              className="gap-2"
                            >
                              <ChevronRight className="w-4 h-4" />
                              Manage
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingEvent(event);
                                setIsFormOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Accommodation Options Management */}
            <div className="mb-8">
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setIsAccommodationFormOpen(false);
                  setEditingAccommodation(null);
                }}
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Events
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground">{selectedEvent.name}</h2>
                  <p className="text-muted-foreground mt-1">{selectedEvent.eventDates}</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingAccommodation(null);
                    setIsAccommodationFormOpen((prev) => !prev);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </Button>
              </div>
            </div>

            {isAccommodationFormOpen && (
              <AccommodationForm
                option={editingAccommodation || undefined}
                onSubmit={editingAccommodation ? handleUpdateAccommodation : handleAddAccommodation}
                onCancel={() => {
                  setIsAccommodationFormOpen(false);
                  setEditingAccommodation(null);
                }}
              />
            )}

            {/* Accommodation Options Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-md">
              <div className="bg-muted/50 px-6 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Accommodation Options</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Icon</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEvent.accommodationOptions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                          No accommodation options. Add one to get started.
                        </td>
                      </tr>
                    ) : (
                      selectedEvent.accommodationOptions.map((option) => (
                        <tr key={option.id} className="border-b border-border hover:bg-muted/50 transition">
                          <td className="px-6 py-4 text-foreground font-medium">{option.title}</td>
                          <td className="px-6 py-4 text-primary font-semibold">{option.price}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{option.icon}</td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAccommodation(option);
                                setIsAccommodationFormOpen(true);
                              }}
                              className="gap-2"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteAccommodation(selectedEvent.id, option.id)}
                              className="gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminProtect>
      <AdminPageContent />
    </AdminProtect>
  );
}
