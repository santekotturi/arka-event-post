'use server';

import { isAuthenticated } from './auth';

export interface ApiStatusResponse {
  success: boolean;
  message: string;
  error?: string;
}

export async function testMeetupConnection(): Promise<ApiStatusResponse> {
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
        error: 'Missing MEETUP_API_KEY in environment variables'
      };
    }

    if (!groupUrlname) {
      return {
        success: false,
        message: 'Meetup group URL name not configured',
        error: 'Missing MEETUP_GROUP_URLNAME in environment variables'
      };
    }

    // Meetup GraphQL endpoint
    const graphqlEndpoint = 'https://api.meetup.com/gql';

    // Simple query to verify authentication
    const query = `
      query {
        self {
          id
          name
          email
        }
      }
    `;

    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: 'Meetup API authentication failed',
        error: `HTTP ${response.status}: ${errorText.substring(0, 100)}`
      };
    }

    const result = await response.json();

    if (result.errors) {
      return {
        success: false,
        message: 'Meetup API authentication failed',
        error: result.errors[0]?.message || 'Invalid API token'
      };
    }

    if (result.data?.self) {
      return {
        success: true,
        message: `Connected as ${result.data.self.name || result.data.self.email || 'Meetup User'}`
      };
    }

    return {
      success: false,
      message: 'Unexpected response from Meetup API',
      error: 'Could not verify authentication'
    };

  } catch (error) {
    console.error('Meetup connection test error:', error);
    return {
      success: false,
      message: 'Failed to connect to Meetup API',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testEventbriteConnection(): Promise<ApiStatusResponse> {
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
        error: 'Missing EVENTBRITE_API_KEY in environment variables'
      };
    }

    if (!organizationId) {
      return {
        success: false,
        message: 'Eventbrite organization ID not configured',
        error: 'Missing EVENTBRITE_ORG_ID in environment variables'
      };
    }

    // Eventbrite user endpoint to verify authentication
    const userEndpoint = 'https://www.eventbriteapi.com/v3/users/me/';

    const response = await fetch(userEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return {
        success: false,
        message: 'Eventbrite API authentication failed',
        error: errorData.error_description || errorData.error || `HTTP ${response.status}`
      };
    }

    const userData = await response.json();

    if (userData.id) {
      // Also verify the organization exists
      const orgEndpoint = `https://www.eventbriteapi.com/v3/organizations/${organizationId}/`;
      
      const orgResponse = await fetch(orgEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (!orgResponse.ok) {
        return {
          success: false,
          message: 'Organization ID is invalid',
          error: `Organization ${organizationId} not found or not accessible`
        };
      }

      const orgData = await orgResponse.json();

      return {
        success: true,
        message: `Connected to ${orgData.name || 'Eventbrite Organization'}`
      };
    }

    return {
      success: false,
      message: 'Unexpected response from Eventbrite API',
      error: 'Could not verify authentication'
    };

  } catch (error) {
    console.error('Eventbrite connection test error:', error);
    return {
      success: false,
      message: 'Failed to connect to Eventbrite API',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}