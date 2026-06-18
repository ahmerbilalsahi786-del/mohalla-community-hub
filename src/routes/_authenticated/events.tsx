import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, X, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Route as AuthLayout } from "@/routes/_authenticated/route";

interface EventRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string | null;
  event_date: string;
  event_time: string | null;
  max_attendees: number | null;
  rsvp_count: number | null;
}

function CreateEventModal({ onClose, userId }: { onClose: () => void; userId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("events").insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        event_date: eventDate,
        event_time: eventTime || null,
        max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events"] }); onClose(); },
    onError: (e: Error) => toast({ title: "Could not create event", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold">Create Event</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description"
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm resize-none" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
              className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm" />
            <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)}
              className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm" />
          </div>
          <input type="number" min={1} value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Max attendees (optional)"
            className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm" />
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-border bg-muted/20 px-4 py-3 sm:px-5 sm:py-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()}
            disabled={title.trim().length < 3 || description.trim().length < 5 || !eventDate || create.isPending}>
            {create.isPending ? "Creating…" : "Create Event"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EventsPage() {
  const { user } = AuthLayout.useRouteContext();
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase.from("events").select("*")
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data as EventRow[]) ?? [];
    },
  });

  const { data: myRsvps = new Set<string>() } = useQuery({
    queryKey: ["my-rsvps", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_rsvps").select("event_id").eq("user_id", user.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.event_id as string));
    },
  });

  const toggleRsvp = useMutation({
    mutationFn: async ({ eventId, going }: { eventId: string; going: boolean }) => {
      if (going) {
        const { error } = await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id, status: "going" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["my-rsvps", user.id] });
    },
    onError: (e: Error) => toast({ title: "Could not update RSVP", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Events</h2>
            <p className="text-sm text-muted-foreground">Upcoming community events.</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto"><Plus size={16} className="mr-1.5" />New Event</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive bg-destructive/10 p-4 text-sm text-destructive">{(error as Error).message}</div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar size={40} className="text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold">No upcoming events</h3>
          <p className="text-sm text-muted-foreground mt-1">Create the first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => {
            const going = myRsvps.has(ev.id);
            const full = !!ev.max_attendees && (ev.rsvp_count ?? 0) >= ev.max_attendees;
            return (
              <div key={ev.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{ev.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{ev.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar size={12} /> {ev.event_date}{ev.event_time ? ` · ${ev.event_time}` : ""}</span>
                      {ev.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {ev.location}</span>}
                      <span className="inline-flex items-center gap-1"><Users size={12} /> {ev.rsvp_count ?? 0}{ev.max_attendees ? `/${ev.max_attendees}` : ""}</span>
                    </div>
                  </div>
                  <Button size="sm" variant={going ? "outline" : "default"}
                    className="w-full sm:w-auto"
                    onClick={() => toggleRsvp.mutate({ eventId: ev.id, going })}
                    disabled={toggleRsvp.isPending || (!going && full)}>
                    {going ? "Going ✓" : full ? "Full" : "RSVP"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} userId={user.id} />}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Events — Mohalla" }, { name: "description", content: "Upcoming community events." }] }),
  component: EventsPage,
});
