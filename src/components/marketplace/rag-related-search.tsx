'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Sparkles, AlertCircle, Camera, X, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MarketplaceTemplateData } from './marketplace-template-card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface RagRelatedSearchProps {
    onSelect: (template: MarketplaceTemplateData) => void;
    className?: string;
}

export function RagRelatedSearch({ onSelect, className }: RagRelatedSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MarketplaceTemplateData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // UI Interface State
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [searchMode, setSearchMode] = useState<'hybrid' | 'style'>('hybrid'); // hybrid (default text) or style (text-to-image)

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // If no text query and no image, do nothing
        if (!query.trim() && !uploadedImage) return;

        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            let data;

            // 1. Image Search (Image-to-Image)
            if (uploadedImage) {
                const formData = new FormData();
                formData.append('file', uploadedImage);
                formData.append('limit', '3');

                const response = await fetch('/api/marketplace/templates/search', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error('이미지 검색 실패');
                data = await response.json();
            }
            // 2. Text Search (Hybrid or Style)
            else {
                const params = new URLSearchParams({
                    q: query,
                    limit: '3',
                    mode: searchMode // 'hybrid' or 'style'
                });

                const response = await fetch(`/api/marketplace/templates/search?${params}`);
                if (!response.ok) throw new Error('검색 실패');
                data = await response.json();
            }

            setResults(data.templates || []);
        } catch (err: any) {
            console.error('Search error:', err);
            setError('검색 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // File Handling
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const setFile = (file: File) => {
        setUploadedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        // Auto search on upload
        setTimeout(() => handleSearch(), 100);
    };

    const clearImage = () => {
        setUploadedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">AI 템플릿 검색</h3>
                </div>
                {/* Search Mode Toggle (Only visible when no image is uploaded) */}
                {!uploadedImage && (
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="style-mode" className="text-xs text-muted-foreground cursor-pointer">스타일 찾기</Label>
                        <Switch
                            id="style-mode"
                            checked={searchMode === 'style'}
                            onCheckedChange={(checked) => setSearchMode(checked ? 'style' : 'hybrid')}
                            className="scale-75"
                        />
                    </div>
                )}
            </div>

            <div
                className={cn(
                    "relative rounded-md transition-all duration-200",
                    isDragOver ? "ring-2 ring-primary bg-primary/5" : ""
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
            >
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        {uploadedImage ? (
                            <div className="flex items-center gap-2 h-9 px-3 w-full rounded-md border border-input bg-background/50 text-sm">
                                <div className="relative h-6 w-6 rounded overflow-hidden flex-shrink-0 border">
                                    {imagePreview && <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />}
                                </div>
                                <span className="flex-1 truncate text-muted-foreground">{uploadedImage.name}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 rounded-full hover:bg-muted"
                                    onClick={clearImage}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={searchMode === 'style' ? "원하는 분위기를 묘사해주세요 (예: 따뜻한 가을 감성)" : "검색어 또는 이미지를 드래그하세요..."}
                                    className="pr-16 text-sm h-9 transition-all"
                                />
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                        title="이미지로 검색 (업로드)"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="h-4 w-4" />
                                    </Button>
                                    <Search className="h-4 w-4 text-muted-foreground opacity-50 mr-1.5" />
                                </div>
                            </>
                        )}
                    </div>

                    {!uploadedImage && (
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isLoading || !query.trim()}
                            className="h-9 px-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '검색'}
                        </Button>
                    )}
                </form>

                {/* Drag Overlay Hint */}
                {isDragOver && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center border-2 border-dashed border-primary z-10">
                        <div className="flex flex-col items-center text-primary font-medium animate-pulse">
                            <ImageIcon className="h-6 w-6 mb-1" />
                            <span className="text-xs">이미지를 여기에 놓으세요</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Area */}
            {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    <span className="text-xs animate-pulse">
                        {uploadedImage ? "이미지를 분석하고 있습니다..." : "AI가 적절한 템플릿을 찾고 있습니다..."}
                    </span>
                </div>
            ) : error ? (
                <div className="py-4 text-center text-red-500 text-sm flex flex-col items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            ) : hasSearched && results.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Search className="h-5 w-5 opacity-50" />
                    </div>
                    <span>검색 결과가 없습니다.</span>
                    {searchMode === 'style' && <span className="text-xs opacity-70">더 구체적으로 묘사해보세요.</span>}
                </div>
            ) : results.length > 0 ? (
                <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                            {uploadedImage ? "이미지와 비슷한 템플릿" : searchMode === 'style' ? "스타일 매칭 결과" : "검색 결과"}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {results.map((template) => (
                            <div
                                key={template.id}
                                className="group relative flex flex-col rounded-xl border bg-card overflow-hidden hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1"
                                onClick={() => onSelect(template)}
                            >
                                {/* Thumbnail - Aspect Ratio 4/3 */}
                                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                                    {template.thumbnailUrl ? (
                                        <img
                                            src={template.thumbnailUrl}
                                            alt={template.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                                            <span className="text-xs text-muted-foreground">No Img</span>
                                        </div>
                                    )}

                                    {/* Similarity Badge (Only show if significant) */}
                                    {template.similarity && template.similarity > 0.8 && (
                                        <Badge className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] h-5 px-1.5 border-none text-white">
                                            {Math.round(template.similarity * 100)}% 일치
                                        </Badge>
                                    )}

                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </div>

                                {/* Info */}
                                <div className="flex flex-col p-3 gap-1.5">
                                    <h4 className="font-semibold text-sm truncate pr-1 text-foreground/90 group-hover:text-primary transition-colors">
                                        {template.name}
                                    </h4>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="bg-secondary/50 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                            {template.category}
                                        </span>
                                        <span className={cn("font-medium", template.price === 0 ? "text-green-600" : "")}>
                                            {template.price === 0 ? 'Free' : `$${template.price}`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
