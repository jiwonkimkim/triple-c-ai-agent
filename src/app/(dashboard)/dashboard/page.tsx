'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus, FolderKanban, Palette, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your projects today.
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value="0"
          description="Active projects"
          icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Brand Profiles"
          value="0"
          description="Configured brands"
          icon={<Palette className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Pages Generated"
          value="0"
          description="This month"
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Credits Remaining"
          value="3"
          description="Free trial credits"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              Create New Project
            </CardTitle>
            <CardDescription>
              Start generating product detail pages with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/projects/new">
              <Button className="w-full">Get Started</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Setup Brand Profile
            </CardTitle>
            <CardDescription>
              Configure your brand voice and style for consistent content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/brands/new">
              <Button variant="outline" className="w-full">
                Add Brand
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Browse Templates
            </CardTitle>
            <CardDescription>
              Explore ready-made templates for quick start
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/templates">
              <Button variant="outline" className="w-full">
                View Templates
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Projects</CardTitle>
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first project to get started with AI-powered content generation.
            </p>
            <Link href="/dashboard/projects/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
