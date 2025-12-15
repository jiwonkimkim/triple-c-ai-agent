'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createProjectSchema, type CreateProjectInput } from '@/lib/validations';

const categories = [
  'Fashion',
  'Food & Beverage',
  'Beauty & Skincare',
  'Electronics',
  'Home & Living',
  'Sports & Fitness',
  'Other',
];

const copyLengthOptions = [
  { value: 'short', label: 'Short', description: 'Concise and punchy' },
  { value: 'medium', label: 'Medium', description: 'Balanced and informative' },
  { value: 'long', label: 'Long', description: 'Detailed and comprehensive' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productInfo, setProductInfo] = useState({
    productName: '',
    category: '',
    keyFeatures: [''],
    targetAudience: '',
    copyLength: 'medium' as const,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // For demo, we'll use placeholder URLs
    // In production, upload to S3 and get URLs
    const newImages = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setProductImages((prev) => [...prev, ...newImages].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (productInfo.keyFeatures.length < 5) {
      setProductInfo((prev) => ({
        ...prev,
        keyFeatures: [...prev.keyFeatures, ''],
      }));
    }
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...productInfo.keyFeatures];
    newFeatures[index] = value;
    setProductInfo((prev) => ({ ...prev, keyFeatures: newFeatures }));
  };

  const removeFeature = (index: number) => {
    if (productInfo.keyFeatures.length > 1) {
      setProductInfo((prev) => ({
        ...prev,
        keyFeatures: prev.keyFeatures.filter((_, i) => i !== index),
      }));
    }
  };

  const onSubmitProject = async (data: CreateProjectInput) => {
    setIsLoading(true);
    try {
      // Create project
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!projectRes.ok) {
        throw new Error('Failed to create project');
      }

      const { data: project } = await projectRes.json();

      toast({
        title: 'Project created!',
        description: 'Now let\'s add product details.',
      });

      setStep(2);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create project. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (productImages.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Images required',
        description: 'Please upload at least one product image.',
      });
      return;
    }

    if (!productInfo.productName || !productInfo.category) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please fill in product name and category.',
      });
      return;
    }

    setIsLoading(true);
    toast({
      title: 'Generating...',
      description: 'AI is creating your product detail page. This may take a moment.',
    });

    // Simulate generation (in production, call the generate API)
    setTimeout(() => {
      toast({
        title: 'Success!',
        description: 'Your detail page has been generated.',
      });
      router.push('/dashboard/projects');
    }, 3000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Step {step} of 2: {step === 1 ? 'Project Details' : 'Product Information'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Give your project a name and optional description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitProject)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Collection Launch"
                  {...register('title')}
                  error={!!errors.title}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this project..."
                  {...register('description')}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Link href="/dashboard/projects">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
              <CardDescription>
                Upload up to 5 product images (at least 1 required)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                {productImages.map((img, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={img}
                      alt={`Product ${index + 1}`}
                      className="h-full w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {productImages.length < 5 && (
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <span className="mt-2 block text-sm text-muted-foreground">
                        Upload
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>
                Tell us about your product for AI-powered content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    placeholder="e.g., Premium Leather Handbag"
                    value={productInfo.productName}
                    onChange={(e) =>
                      setProductInfo((prev) => ({ ...prev, productName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select
                    value={productInfo.category}
                    onValueChange={(value) =>
                      setProductInfo((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Key Features *</Label>
                <div className="space-y-2">
                  {productInfo.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Feature ${index + 1}`}
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                      />
                      {productInfo.keyFeatures.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFeature(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {productInfo.keyFeatures.length < 5 && (
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                    Add Feature
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Input
                  placeholder="e.g., Fashion-forward women aged 25-40"
                  value={productInfo.targetAudience}
                  onChange={(e) =>
                    setProductInfo((prev) => ({ ...prev, targetAudience: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Copy Length</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {copyLengthOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        productInfo.copyLength === option.value
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="copyLength"
                        value={option.value}
                        checked={productInfo.copyLength === option.value}
                        onChange={(e) =>
                          setProductInfo((prev) => ({
                            ...prev,
                            copyLength: e.target.value as 'short' | 'medium' | 'long',
                          }))
                        }
                        className="sr-only"
                      />
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Detail Page'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
