"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventFormSchema, type EventFormData } from "@/lib/validations";
import { createMeetupEvent } from "@/app/actions/meetup";
import { createEventbriteEvent } from "@/app/actions/eventbrite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/date-time-picker";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showMeetupKey, setShowMeetupKey] = useState(false);
  const [showEventbriteKey, setShowEventbriteKey] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
  });

  const startDateTime = watch("startDateTime");
  const endDateTime = watch("endDateTime");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setValue("photo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    const results = [];

    try {
      // Post to Meetup if API key is provided
      if (data.meetupApiKey && data.meetupGroupUrlname) {
        const meetupResult = await createMeetupEvent({
          title: data.title,
          description: data.description,
          startDateTime: data.startDateTime,
          endDateTime: data.endDateTime,
          venue: data.venue,
          photo: data.photo,
          apiKey: data.meetupApiKey,
          groupUrlname: data.meetupGroupUrlname,
        });

        if (meetupResult.success) {
          toast({
            title: "Meetup Event Created",
            description: `Event posted successfully! ${meetupResult.eventUrl ? `View at: ${meetupResult.eventUrl}` : ''}`,
          });
        } else {
          toast({
            title: "Meetup Error",
            description: meetupResult.error || "Failed to create Meetup event",
            variant: "destructive",
          });
        }
        results.push(meetupResult);
      }

      // Post to Eventbrite if API key is provided
      if (data.eventbriteApiKey && data.eventbriteOrgId) {
        const eventbriteResult = await createEventbriteEvent({
          title: data.title,
          description: data.description,
          startDateTime: data.startDateTime,
          endDateTime: data.endDateTime,
          venue: data.venue,
          photo: data.photo,
          apiKey: data.eventbriteApiKey,
          organizationId: data.eventbriteOrgId,
        });

        if (eventbriteResult.success) {
          toast({
            title: "Eventbrite Event Created",
            description: `Event posted successfully! ${eventbriteResult.eventUrl ? `View at: ${eventbriteResult.eventUrl}` : ''}`,
          });
        } else {
          toast({
            title: "Eventbrite Error",
            description: eventbriteResult.error || "Failed to create Eventbrite event",
            variant: "destructive",
          });
        }
        results.push(eventbriteResult);
      }

      if (results.length === 0) {
        toast({
          title: "No API Keys Provided",
          description: "Please provide at least one API key to post events",
          variant: "destructive",
        });
      } else if (results.some(r => r.success)) {
        // Clear form if at least one was successful
        reset();
        setPhotoPreview(null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Post Event to Multiple Platforms</CardTitle>
          <CardDescription>
            Create and post your event to Meetup and Eventbrite simultaneously
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Event Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event..."
                  rows={5}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date & Time *</Label>
                  <DateTimePicker
                    date={startDateTime}
                    setDate={(date) => setValue("startDateTime", date as Date)}
                    placeholder="Select start date and time"
                  />
                  {errors.startDateTime && (
                    <p className="text-sm text-destructive">{errors.startDateTime.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>End Date & Time *</Label>
                  <DateTimePicker
                    date={endDateTime}
                    setDate={(date) => setValue("endDateTime", date as Date)}
                    placeholder="Select end date and time"
                  />
                  {errors.endDateTime && (
                    <p className="text-sm text-destructive">{errors.endDateTime.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue/Location</Label>
                <Input
                  id="venue"
                  placeholder="Enter venue or address (optional)"
                  {...register("venue")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo">Event Photo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("photo")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Event preview"
                      className="h-20 w-20 object-cover rounded"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* API Keys Section */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Platform API Keys</h3>
              <p className="text-sm text-muted-foreground">
                Enter your API keys to post to each platform. Keys are never stored and only used for this request.
              </p>

              {/* Meetup */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Meetup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="meetupApiKey">API Key (OAuth Token)</Label>
                    <div className="relative">
                      <Input
                        id="meetupApiKey"
                        type={showMeetupKey ? "text" : "password"}
                        placeholder="Enter your Meetup OAuth token"
                        {...register("meetupApiKey")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowMeetupKey(!showMeetupKey)}
                      >
                        {showMeetupKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meetupGroupUrlname">Group URL Name</Label>
                    <Input
                      id="meetupGroupUrlname"
                      placeholder="e.g., tech-meetup-sf"
                      {...register("meetupGroupUrlname")}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Eventbrite */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Eventbrite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="eventbriteApiKey">Private Token</Label>
                    <div className="relative">
                      <Input
                        id="eventbriteApiKey"
                        type={showEventbriteKey ? "text" : "password"}
                        placeholder="Enter your Eventbrite private token"
                        {...register("eventbriteApiKey")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowEventbriteKey(!showEventbriteKey)}
                      >
                        {showEventbriteKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventbriteOrgId">Organization ID</Label>
                    <Input
                      id="eventbriteOrgId"
                      placeholder="e.g., 123456789"
                      {...register("eventbriteOrgId")}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting Event...
                </>
              ) : (
                "Post Event"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
