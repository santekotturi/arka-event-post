'use server';

import { isAuthenticated } from './auth';

export interface MeetupEventData {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  venue?: string;
  photo?: string;
}

export interface MeetupResponse {
  success: boolean;
  message: string;
  eventId?: string;
  eventUrl?: string;
  error?: string;
}

export async function createMeetupEvent(data: MeetupEventData): Promise<MeetupResponse> {
  try {
    // Check authentication
    if (!(await isAuthenticated())) {
      return {
        success: false,
        message: 'Authentication required',
        error: 'Not authenticated'
      };
    }

    const apiKey = process.env.MEETUP_API_KEY;
    const groupUrlname = process.env.MEETUP_GROUP_URLNAME;

    if (!apiKey) {
      return {
        success: false,
        message: 'Meetup API key not configured',
        error: 'Missing API key in environment'
      };
    }

    if (!groupUrlname) {
      return {
        success: false,
        message: 'Meetup group URL name not configured',
        error: 'Missing group URL name in environment'
      };
    }

    // Meetup GraphQL endpoint
    const graphqlEndpoint = 'https://api.meetup.com/gql';

    // Create event mutation
    const mutation = `
      mutation CreateEvent($input: CreateEventInput!) {
        createEvent(input: $input) {
          event {
            id
            title
            eventUrl
          }
          errors {
            message
            field
          }
        }
      }
    `;

    const variables = {
      input: {
        groupUrlname: groupUrlname,
        title: data.title,
        description: data.description,
        startDateTime: data.startDateTime.toISOString(),
        duration: Math.floor((data.endDateTime.getTime() - data.startDateTime.getTime()) / 1000),
        publishStatus: 'PUBLISHED',
        ...(data.venue && { 
          venueId: null,
          onlineVenue: false,
          address: data.venue 
        })
      }
    };

    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables
      })
    });

    const result = await response.json();

    if (result.errors) {
      return {
        success: false,
        message: 'Failed to create Meetup event',
        error: result.errors[0]?.message || 'Unknown error occurred'
      };
    }

    if (result.data?.createEvent?.errors?.length > 0) {
      return {
        success: false,
        message: 'Failed to create Meetup event',
        error: result.data.createEvent.errors[0]?.message || 'Event creation failed'
      };
    }

    if (result.data?.createEvent?.event) {
      return {
        success: true,
        message: 'Meetup event created successfully',
        eventId: result.data.createEvent.event.id,
        eventUrl: result.data.createEvent.event.eventUrl
      };
    }

    return {
      success: false,
      message: 'Unexpected response from Meetup API',
      error: 'Invalid response structure'
    };

  } catch (error) {
    console.error('Meetup API error:', error);
    return {
      success: false,
      message: 'Failed to connect to Meetup API',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}