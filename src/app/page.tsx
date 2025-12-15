import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Palette, Clock, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Triple C</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-1 flex-col items-center justify-center space-y-8 py-24 text-center md:py-32">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Create Professional
            <br />
            <span className="text-primary">Product Detail Pages</span>
            <br />
            in Minutes
          </h1>
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Triple C is an AI-powered marketing contents agent that helps you generate,
            edit, and export stunning product detail pages and promotional creatives.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          No credit card required. 3 free generations included.
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Create
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From idea to published content in one seamless workflow
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-primary" />}
              title="AI-Powered Generation"
              description="Generate complete detail pages with compelling copy from just a few product images and basic info."
            />
            <FeatureCard
              icon={<Palette className="h-10 w-10 text-primary" />}
              title="Brand Consistency"
              description="RAG-based brand analysis ensures all content matches your unique brand voice and style."
            />
            <FeatureCard
              icon={<Clock className="h-10 w-10 text-primary" />}
              title="10x Faster"
              description="What used to take hours now takes minutes. Focus on strategy, not execution."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-primary" />}
              title="Team Collaboration"
              description="B2B workspaces let your entire marketing team collaborate on projects seamlessly."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to professional marketing content
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              step="1"
              title="Upload & Describe"
              description="Upload your product images and provide basic information like name, features, and target audience."
            />
            <StepCard
              step="2"
              title="Generate & Choose"
              description="AI generates two unique versions of your detail page. Pick the one that fits best or mix and match."
            />
            <StepCard
              step="3"
              title="Edit & Export"
              description="Fine-tune with our visual editor. Export as HTML, images, GIFs, or videos for any platform."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary py-24 text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Transform Your Marketing?
          </h2>
          <p className="mx-auto mt-4 max-w-[600px] text-lg text-primary-foreground/90">
            Join thousands of marketers who are already creating stunning content
            with Triple C.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Triple C</span>
            <span className="text-sm text-muted-foreground">
              Marketing Contents Agent
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Triple C. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
        {step}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
