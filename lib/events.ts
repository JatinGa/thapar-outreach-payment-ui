// Types
export interface AccommodationOption {
  id: string;
  title: string;
  description: string;
  price: string;
  icon: 'utensils' | 'bed';
}

export interface Event {
  id: string;
  name: string;
  eventDates: string; // e.g., "17–19 April"
  outsideDescription: string;
  insideDescription: string;
  accommodationOptions: AccommodationOption[];
  createdAt: string;
  updatedAt: string;
}

const EVENTS_STORAGE_KEY = 'thapar_events';
const EVENTS_UPDATED_EVENT = 'thapar-events-updated';

type LegacyEvent = {
  id?: string;
  title?: string;
  description?: string;
  price?: string;
  icon?: 'utensils' | 'bed';
};

function notifyEventsUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENTS_UPDATED_EVENT));
  }
}

function cloneDefaultEvent(event: Event): Event {
  return {
    ...event,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    accommodationOptions: event.accommodationOptions.map((option) => ({ ...option })),
  };
}

function ensureDefaultEventsPresent(events: Event[]): Event[] {
  const hasHelix = events.some(
    (event) => event.id === 'helix-2024' || event.name.trim().toLowerCase() === 'helix'
  );

  if (hasHelix) return events;

  return [cloneDefaultEvent(DEFAULT_EVENTS[0]), ...events];
}

function normalizeEvents(raw: unknown): Event[] {
  if (!Array.isArray(raw)) return DEFAULT_EVENTS;

  const normalized = raw
    .map((item) => {
      const value = item as Partial<Event> & LegacyEvent;

      if (typeof value.name === 'string' && Array.isArray(value.accommodationOptions)) {
        const options = value.accommodationOptions
          .filter((option) =>
            option &&
            typeof option.id === 'string' &&
            typeof option.title === 'string' &&
            typeof option.description === 'string' &&
            typeof option.price === 'string' &&
            (option.icon === 'bed' || option.icon === 'utensils')
          )
          .map((option) => ({
            id: option.id,
            title: option.title,
            description: option.description,
            price: option.price,
            icon: option.icon,
          }));

        return {
          id: typeof value.id === 'string' ? value.id : `event-${Date.now()}`,
          name: value.name,
          eventDates: typeof value.eventDates === 'string' ? value.eventDates : '17–19 April',
          outsideDescription:
            typeof value.outsideDescription === 'string'
              ? value.outsideDescription
              : typeof (value as { eventDescription?: string }).eventDescription === 'string'
                ? (value as { eventDescription: string }).eventDescription
                : 'Event details will be updated soon.',
          insideDescription:
            typeof value.insideDescription === 'string'
              ? value.insideDescription
              : typeof (value as { eventDescription?: string }).eventDescription === 'string'
                ? (value as { eventDescription: string }).eventDescription
                : 'Please select your preferred accommodation package.',
          accommodationOptions: options,
          createdAt:
            typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
          updatedAt:
            typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
        } satisfies Event;
      }

      if (
        typeof value.title === 'string' &&
        typeof value.description === 'string' &&
        typeof value.price === 'string'
      ) {
        const eventId = typeof value.id === 'string' ? value.id : `event-${Date.now()}`;
        return {
          id: eventId,
          name: value.title,
          eventDates: '17–19 April',
          outsideDescription: value.description,
          insideDescription: value.description,
          accommodationOptions: [
            {
              id: `${eventId}-option`,
              title: 'Accommodation Option',
              description: value.description,
              price: value.price,
              icon: value.icon === 'utensils' ? 'utensils' : 'bed',
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } satisfies Event;
      }

      return null;
    })
    .filter((event): event is Event => event !== null);

  if (normalized.length === 0) return DEFAULT_EVENTS.map(cloneDefaultEvent);

  return ensureDefaultEventsPresent(normalized);
}

const DEFAULT_EVENTS: Event[] = [
  {
    id: 'helix-2024',
    name: 'Helix',
    eventDates: '17–19 April',
    outsideDescription: 'Helix is the flagship event of Thapar Institute. Join us for an amazing experience with accommodation and dining options.',
    insideDescription: 'Please select your preferred accommodation package for Helix. Meal services, where applicable, will be provided by Sodexo.',
    accommodationOptions: [
      {
        id: 'helix-accommodation-food',
        title: 'Accommodation + Food',
        description: 'Includes accommodation and meals for 17–19 April. Food services will be provided by Sodexo.',
        price: '₹1,200',
        icon: 'utensils',
      },
      {
        id: 'helix-accommodation-only',
        title: 'Accommodation Only',
        description: 'Includes accommodation for 17–19 April. Meals are not included in this plan.',
        price: '₹500',
        icon: 'bed',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Get all events
export function getEvents(): Event[] {
  if (typeof window === 'undefined') return DEFAULT_EVENTS; // Server-side fallback

  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!stored) {
      // Initialize with defaults if not present
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(DEFAULT_EVENTS));
      return DEFAULT_EVENTS;
    }

    const parsed = JSON.parse(stored);
    const normalized = normalizeEvents(parsed);
    localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(DEFAULT_EVENTS));
    } catch {
      // localStorage may be unavailable in some browser privacy modes
    }
    return DEFAULT_EVENTS;
  }
}

export function resetEventsToDefault(): Event[] {
  const defaults = DEFAULT_EVENTS.map(cloneDefaultEvent);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(defaults));
      notifyEventsUpdated();
    } catch {
      // ignore storage errors in restricted browser modes
    }
  }

  return defaults;
}

// Add a new event
export function addEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Event {
  const events = getEvents();
  const newEvent: Event = {
    ...event,
    id: `event-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  events.push(newEvent);
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  notifyEventsUpdated();
  return newEvent;
}

// Update an event
export function updateEvent(id: string, updates: Partial<Omit<Event, 'id' | 'createdAt'>>): Event | null {
  const events = getEvents();
  const index = events.findIndex(e => e.id === id);
  
  if (index === -1) return null;
  
  events[index] = {
    ...events[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  notifyEventsUpdated();
  return events[index];
}

// Delete an event
export function deleteEvent(id: string): boolean {
  const events = getEvents();
  const filtered = events.filter(e => e.id !== id);
  
  if (filtered.length === events.length) return false; // Not found
  
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(filtered));
  notifyEventsUpdated();
  return true;
}

// Get a single event by ID
export function getEventById(id: string): Event | null {
  const events = getEvents();
  return events.find(e => e.id === id) || null;
}

// Add accommodation option to event
export function addAccommodationOption(
  eventId: string,
  option: Omit<AccommodationOption, 'id'>
): Event | null {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  
  if (!event) return null;
  
  const newOption: AccommodationOption = {
    ...option,
    id: `option-${Date.now()}`,
  };
  
  event.accommodationOptions.push(newOption);
  event.updatedAt = new Date().toISOString();
  
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  notifyEventsUpdated();
  return event;
}

// Update accommodation option
export function updateAccommodationOption(
  eventId: string,
  optionId: string,
  updates: Partial<Omit<AccommodationOption, 'id'>>
): Event | null {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  
  if (!event) return null;
  
  const option = event.accommodationOptions.find(o => o.id === optionId);
  if (!option) return null;
  
  Object.assign(option, updates);
  event.updatedAt = new Date().toISOString();
  
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  notifyEventsUpdated();
  return event;
}

// Delete accommodation option
export function deleteAccommodationOption(eventId: string, optionId: string): Event | null {
  const events = getEvents();
  const event = events.find(e => e.id === eventId);
  
  if (!event) return null;
  
  event.accommodationOptions = event.accommodationOptions.filter(o => o.id !== optionId);
  event.updatedAt = new Date().toISOString();
  
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  notifyEventsUpdated();
  return event;
}
