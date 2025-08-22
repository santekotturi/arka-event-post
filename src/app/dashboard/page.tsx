"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventFormSchema, type EventFormData } from "@/lib/validations";
import { createMeetupEvent } from "@/app/actions/meetup";
import { createEventbriteEvent } from "@/app/actions/eventbrite";
import { logout } from "@/app/actions/auth";
import { testMeetupConnection, testEventbriteConnection } from "@/app/actions/api-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/date-time-picker";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, LogOut, CheckCircle2, Wifi } from "lucide-react";
import Image from "next/image";

export default function DashboardPage() {
  const { toast } = useToast();
  const [isPostingMeetup, setIsPostingMeetup] = useState(false);
  const [isPostingEventbrite, setIsPostingEventbrite] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [meetupConnected, setMeetupConnected] = useState(false);
  const [eventbriteConnected, setEventbriteConnected] = useState(false);
  const [testingMeetup, setTestingMeetup] = useState(false);
  const [testingEventbrite, setTestingEventbrite] = useState(false);
  const [lastMeetupUrl, setLastMeetupUrl] = useState<string | null>(null);
  const [lastEventbriteUrl, setLastEventbriteUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
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

  const postToMeetup = async (data: EventFormData) => {
    setIsPostingMeetup(true);
    try {
      const meetupResult = await createMeetupEvent({
        title: data.title,
        description: data.description,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        venue: data.venue,
        photo: data.photo,
      });

      if (meetupResult.success) {
        setLastMeetupUrl(meetupResult.eventUrl || null);
        toast({
          title: "✅ Meetup Event Created",
          description: (
            <div className="flex flex-col gap-2">
              <span>Event posted successfully!</span>
              {meetupResult.eventUrl && (
                <a 
                  href={meetupResult.eventUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 underline hover:text-blue-600"
                >
                  View event on Meetup →
                </a>
              )}
            </div>
          ) as React.ReactNode,
        });
      } else {
        toast({
          title: "Meetup Error",
          description: meetupResult.error || "Failed to create Meetup event",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred with Meetup",
        variant: "destructive",
      });
    } finally {
      setIsPostingMeetup(false);
    }
  };

  const postToEventbrite = async (data: EventFormData) => {
    setIsPostingEventbrite(true);
    try {
      const eventbriteResult = await createEventbriteEvent({
        title: data.title,
        description: data.description,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        venue: data.venue,
        photo: data.photo,
      });

      if (eventbriteResult.success) {
        setLastEventbriteUrl(eventbriteResult.eventUrl || null);
        toast({
          title: "✅ Eventbrite Event Created",
          description: (
            <div className="flex flex-col gap-2">
              <span>Event posted successfully!</span>
              {eventbriteResult.eventUrl && (
                <a 
                  href={eventbriteResult.eventUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 underline hover:text-blue-600"
                >
                  View event on Eventbrite →
                </a>
              )}
            </div>
          ) as React.ReactNode,
        });
      } else {
        toast({
          title: "Eventbrite Error",
          description: eventbriteResult.error || "Failed to create Eventbrite event",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred with Eventbrite",
        variant: "destructive",
      });
    } finally {
      setIsPostingEventbrite(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const testMeetup = async () => {
    setTestingMeetup(true);
    try {
      const result = await testMeetupConnection();
      if (result.success) {
        setMeetupConnected(true);
        toast({
          title: "Meetup Connected",
          description: result.message,
        });
      } else {
        setMeetupConnected(false);
        toast({
          title: "Meetup Connection Failed",
          description: result.error || result.message,
          variant: "destructive",
        });
      }
    } catch {
      setMeetupConnected(false);
      toast({
        title: "Error",
        description: "Failed to test Meetup connection",
        variant: "destructive",
      });
    } finally {
      setTestingMeetup(false);
    }
  };

  const testEventbrite = async () => {
    setTestingEventbrite(true);
    try {
      const result = await testEventbriteConnection();
      if (result.success) {
        setEventbriteConnected(true);
        toast({
          title: "Eventbrite Connected",
          description: result.message,
        });
      } else {
        setEventbriteConnected(false);
        toast({
          title: "Eventbrite Connection Failed",
          description: result.error || result.message,
          variant: "destructive",
        });
      }
    } catch {
      setEventbriteConnected(false);
      toast({
        title: "Error",
        description: "Failed to test Eventbrite connection",
        variant: "destructive",
      });
    } finally {
      setTestingEventbrite(false);
    }
  };

  return (
    <main className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
      
      {/* API Status Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            API Connection Status
          </CardTitle>
          <CardDescription>
            Test your API connections before posting events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={testMeetup}
              disabled={testingMeetup}
              className="relative"
            >
              {testingMeetup ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Meetup...
                </>
              ) : (
                <>
                  Test Meetup API
                  {meetupConnected && (
                    <CheckCircle2 className="ml-2 h-4 w-4 text-green-600" />
                  )}
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={testEventbrite}
              disabled={testingEventbrite}
              className="relative"
            >
              {testingEventbrite ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Eventbrite...
                </>
              ) : (
                <>
                  Test Eventbrite API
                  {eventbriteConnected && (
                    <CheckCircle2 className="ml-2 h-4 w-4 text-green-600" />
                  )}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
                    <Image
                      src={photoPreview}
                      alt="Event preview"
                      width={80}
                      height={80}
                      className="h-20 w-20 object-cover rounded"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Post Buttons */}
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Post to Platforms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      onClick={handleSubmit(postToMeetup)}
                      className="w-full" 
                      disabled={isPostingMeetup}
                      variant={lastMeetupUrl ? "secondary" : "default"}
                    >
                      {isPostingMeetup ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting to Meetup...
                        </>
                      ) : (
                        <>
                          {lastMeetupUrl && <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />}
                          Post to Meetup
                        </>
                      )}
                    </Button>
                    {lastMeetupUrl && (
                      <a 
                        href={lastMeetupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-600 underline block text-center"
                      >
                        View last Meetup event
                      </a>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      onClick={handleSubmit(postToEventbrite)}
                      className="w-full"
                      disabled={isPostingEventbrite}
                      variant={lastEventbriteUrl ? "secondary" : "default"}
                    >
                      {isPostingEventbrite ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting to Eventbrite...
                        </>
                      ) : (
                        <>
                          {lastEventbriteUrl && <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />}
                          Post to Eventbrite
                        </>
                      )}
                    </Button>
                    {lastEventbriteUrl && (
                      <a 
                        href={lastEventbriteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-600 underline block text-center"
                      >
                        View last Eventbrite event
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
