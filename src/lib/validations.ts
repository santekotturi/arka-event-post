import { z } from 'zod';

export const eventFormSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be less than 5000 characters'),
  startDateTime: z.date({
    required_error: 'Start date and time is required',
  }),
  endDateTime: z.date({
    required_error: 'End date and time is required',
  }),
  venue: z.string().optional(),
  photo: z.any().optional(),
  
  // Meetup fields
  meetupApiKey: z.string().optional(),
  meetupGroupUrlname: z.string().optional(),
  
  // Eventbrite fields
  eventbriteApiKey: z.string().optional(),
  eventbriteOrgId: z.string().optional(),
}).refine((data) => data.endDateTime > data.startDateTime, {
  message: 'End date must be after start date',
  path: ['endDateTime'],
});

export type EventFormData = z.infer<typeof eventFormSchema>;