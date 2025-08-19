# Event Poster - Multi-Platform Event Publisher

A Next.js application that allows you to post events to Meetup and Eventbrite simultaneously using your own API keys.

## Features

- 📅 **Single Form Submission**: Create events on multiple platforms with one form
- 🔐 **Secure API Key Handling**: API keys are never stored, only used for the current request
- 📸 **Photo Upload**: Support for event images with preview
- ⏰ **Date/Time Picker**: Intuitive date and time selection using shadcn components
- ✅ **Form Validation**: Comprehensive validation with Zod
- 🔄 **Server Actions**: Uses Next.js 15 server actions for secure API communication
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- API keys for the platforms you want to use:
  - **Meetup**: OAuth token and group URL name
  - **Eventbrite**: Private token and organization ID

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### Getting Your API Keys

#### Meetup
1. You need a Meetup Pro subscription to create OAuth consumers
2. Visit [Meetup OAuth Clients](https://www.meetup.com/api/oauth/list/)
3. Create a new OAuth client
4. Use the OAuth token for posting events
5. Find your group's URL name (e.g., "tech-meetup-sf" from meetup.com/tech-meetup-sf)

#### Eventbrite
1. Go to [Eventbrite Account Settings](https://www.eventbrite.com/account-settings/)
2. Navigate to Developer Links → API Keys
3. Create an API key
4. Copy your Private Token
5. Find your Organization ID in your Eventbrite account settings

### Posting Events

1. Fill in the event details:
   - Event title (required)
   - Description (required, min 10 characters)
   - Start date and time (required)
   - End date and time (required)
   - Venue/location (optional)
   - Event photo (optional, max 10MB)

2. Enter your API credentials:
   - For Meetup: Enter your OAuth token and group URL name
   - For Eventbrite: Enter your private token and organization ID
   - You can use one or both platforms

3. Click "Post Event" to submit to the selected platforms

## Security Notes

- **API Keys**: Your API keys are never stored or logged. They are only used in server-side actions for the current request.
- **Server Actions**: All API communication happens server-side using Next.js server actions, keeping your credentials secure.
- **HTTPS Only**: Always use HTTPS in production to ensure secure transmission of API keys.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```
