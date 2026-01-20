"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserCog } from "lucide-react";

export default function DashboardGateway() {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl w-full">
        
        {/* Convenor Card */}
        <Card className="hover:shadow-lg transition-shadow border-purple-200">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-purple-100 p-4 rounded-full mb-4 w-fit">
               <UserCog className="h-10 w-10 text-purple-600" />
            </div>
            <CardTitle>Convenor Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-zinc-500">
              Manage your events, build registration forms, and track participants.
            </p>
            <Link href="/convenor">
               <Button className="w-full bg-purple-600 hover:bg-purple-700">Enter as Convenor</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Admin Card */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-zinc-100 p-4 rounded-full mb-4 w-fit">
               <Shield className="h-10 w-10 text-zinc-600" />
            </div>
            <CardTitle>Admin Console</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-zinc-500">
              Oversee all events, manage users, and view global statistics.
            </p>
            <Link href="/admin">
               <Button variant="outline" className="w-full">Enter as Admin</Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}