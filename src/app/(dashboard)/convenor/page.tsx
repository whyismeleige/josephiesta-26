"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, MapPin, Users, FileText, Settings, ExternalLink } from "lucide-react";

// MOCK DATA: In the real app, this comes from your database based on the logged-in user
const mockEvents = [
  {
    id: "evt-123",
    name: "Hackathon 2026",
    date: "Feb 12, 2026",
    venue: "Main Auditorium",
    status: "published",
    registrations: 142,
    capacity: 200,
    hasForm: true,
  },
  {
    id: "evt-456",
    name: "Beatboxing Battle",
    date: "Feb 13, 2026",
    venue: "Open Air Theatre",
    status: "draft",
    registrations: 0,
    capacity: 50,
    hasForm: false, // This one needs a form created!
  }
];

export default function ConvenorDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50/50 p-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Convenor Dashboard</h1>
          <p className="text-zinc-500 mt-1">Manage your events and track registrations.</p>
        </div>
        <Link href="/convenor/create-event">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-2 h-4 w-4" /> Create New Event
          </Button>
        </Link>
      </div>

      {/* --- STATS OVERVIEW --- */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEvents.length}</div>
            <p className="text-xs text-zinc-500">Assigned to you</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-zinc-500">+12% from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-zinc-500">Requires your attention</p>
          </CardContent>
        </Card>
      </div>

      {/* --- EVENTS LIST --- */}
      <h2 className="text-xl font-semibold mb-4 text-zinc-800">Your Events</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {mockEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden transition-all hover:shadow-md border-zinc-200">
            <div className="flex flex-col md:flex-row">
              
              {/* Left Stripe based on status */}
              <div className={`w-full md:w-2 h-2 md:h-auto ${event.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              
              <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                
                {/* Event Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-xl">{event.name}</h3>
                    <Badge variant={event.status === 'published' ? 'default' : 'secondary'} className={event.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
                      {event.status === 'published' ? 'Live' : 'Draft'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-zinc-500 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {event.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {event.venue}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {event.registrations} / {event.capacity} registered
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100">
                    
                    {/* 1. Edit Details */}
                    <Link href={`/convenor/events/${event.id}/edit`}>
                        <Button variant="outline" size="sm" className="h-9">
                           <Settings className="mr-2 h-3.5 w-3.5" /> Settings
                        </Button>
                    </Link>

                    {/* 2. Form Builder (LINKS TO THE PAGE WE MADE) */}
                    <Link href={`/convenor/form-builder/${event.id}`}>
                        <Button variant="outline" size="sm" className={`h-9 ${!event.hasForm ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100" : ""}`}>
                           <FileText className="mr-2 h-3.5 w-3.5" /> 
                           {event.hasForm ? "Edit Form" : "Create Form"}
                        </Button>
                    </Link>

                    {/* 3. View Registrations */}
                    <Link href={`/convenor/events/${event.id}/registrations`}>
                         <Button size="sm" className="h-9 bg-zinc-900 text-white hover:bg-zinc-800">
                           View Data <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </Button>
                    </Link>
                </div>

              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}