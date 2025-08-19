'use server';

export interface MeetupEventData {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
  venue?: string;
  photo?: string;
  apiKey: string;
  groupUrlname: string;
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
    if (!data.apiKey) {
      return {
        success: false,
        message: 'Meetup API key is required',
        error: 'Missing API key'
      };
    }

    if (!data.groupUrlname) {
      return {
        success: false,
        message: 'Meetup group URL name is required',
        error: 'Missing group URL name'
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
        groupUrlname: data.groupUrlname,
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
        'Authorization': `Bearer ${data.apiKey}`,
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