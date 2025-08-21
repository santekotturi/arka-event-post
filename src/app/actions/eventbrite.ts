'use server';

import { isAuthenticated } from './auth';

export interface EventbriteEventData {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  venue?: string;
  photo?: string;
}

export interface EventbriteResponse {
  success: boolean;
  message: string;
  eventId?: string;
  eventUrl?: string;
  error?: string;
}

export async function createEventbriteEvent(data: EventbriteEventData): Promise<EventbriteResponse> {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'Not authenticated'
      };
    }

    const apiKey = process.env.EVENTBRITE_API_KEY;
    const organizationId = process.env.EVENTBRITE_ORG_ID;

    if (!apiKey) {
      return {
        success: false,
        message: 'Eventbrite API key not configured',
        error: 'Missing API key in environment'
      };
    }

    if (!organizationId) {
      return {
        success: false,
        message: 'Eventbrite organization ID not configured',
        error: 'Missing organization ID in environment'
      };
    }

    // Step 1: Create draft event
    const eventEndpoint = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/events/`;
    
    const eventPayload = {
      event: {
        name: {
          html: data.title
        },
        description: {
          html: data.description
        },
        start: {
          timezone: 'America/Los_Angeles',
          utc: data.startDateTime.toISOString().replace('.000Z', 'Z')
        },
        end: {
          timezone: 'America/Los_Angeles',
          utc: data.endDateTime.toISOString().replace('.000Z', 'Z')
        },
        currency: 'USD',
        online_event: !data.venue,
        listed: true,
        shareable: true
      }
    };

    const eventResponse = await fetch(eventEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload)
    });

    if (!eventResponse.ok) {
      const errorData = await eventResponse.json();
      return {
        success: false,
        message: 'Failed to create Eventbrite event',
        error: errorData.error_description || errorData.error || 'Event creation failed'
      };
    }

    const eventData = await eventResponse.json();
    const eventId = eventData.id;

    // Step 2: Create a free ticket class
    const ticketEndpoint = `https://www.eventbriteapi.com/v3/events/${eventId}/ticket_classes/`;
    
    const ticketPayload = {
      ticket_class: {
        name: 'General Admission',
        free: true,
        quantity_total: 100,
        minimum_quantity: 1,
        maximum_quantity: 10
      }
    };

    const ticketResponse = await fetch(ticketEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketPayload)
    });

    if (!ticketResponse.ok) {
      console.error('Failed to create ticket class, but event was created');
    }

    // Step 3: Publish the event
    const publishEndpoint = `https://www.eventbriteapi.com/v3/events/${eventId}/publish/`;
    
    const publishResponse = await fetch(publishEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!publishResponse.ok) {
      const publishError = await publishResponse.json();
      return {
        success: true,
        message: 'Event created but not published. You may need to complete additional requirements in Eventbrite.',
        eventId: eventId,
        eventUrl: eventData.url,
        error: publishError.error_description || 'Publishing failed'
      };
    }

    return {
      success: true,
      message: 'Eventbrite event created and published successfully',
      eventId: eventId,
      eventUrl: eventData.url
    };

  } catch (error) {
    console.error('Eventbrite API error:', error);
    return {
      success: false,
      message: 'Failed to connect to Eventbrite API',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}