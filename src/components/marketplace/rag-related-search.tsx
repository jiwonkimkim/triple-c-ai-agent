'use client';

import { useState } from 'react';
import { Search, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MarketplaceTemplateData } from './marketplace-template-card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const params = new URLSearchParams({
                q: query,
                limit: '3',
                mode: 'hybrid'
            });

            const response = await fetch(`/api/marketplace/templates/search?${params}`);

            if (!response.ok) {
                throw new Error('검색에 실패했습니다.');
            }

            const data = await response.json();
            setResults(data.templates || []);
        } catch (err: any) {
            console.error('Search error:', err);
            setError('검색 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">AI 템플릿 검색</h3>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="원하는 스타일을 설명해주세요..."
                        className="pr-8 text-sm h-9"
                    />
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
                <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading || !query.trim()}
                    className="h-9"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '검색'}
                </Button>
            </form>

            {/* Results Area */}
            {isLoading ? (
                <div className="py-8 flex justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </div>
            ) : error ? (
                <div className="py-4 text-center text-red-500 text-sm flex flex-col items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            ) : hasSearched && results.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                    검색 결과가 없습니다.
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    {results.map((template) => (
                        <div
                            key={template.id}
                            className="group relative flex flex-col rounded-lg border overflow-hidden hover:shadow-md cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 bg-background"
                            onClick={() => onSelect(template)}
                        >
                            {/* Thumbnail - Aspect Ratio 4/3 like Marketplace */}
                            <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                                {template.thumbnailUrl ? (
                                    <img
                                        src={template.thumbnailUrl}
                                        alt={template.name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                                        <span className="text-xs text-muted-foreground">No Img</span>
                                    </div>
                                )}

                                {/* Price Badge */}
                                <Badge
                                    variant={template.price === 0 ? "secondary" : "default"}
                                    className="absolute top-2 right-2 text-[10px] px-1.5 h-5 bg-opacity-90 backdrop-blur-sm"
                                >
                                    {template.price === 0 ? '무료' : `${template.price}`}
                                </Badge>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col p-3 gap-1">
                                <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-sm truncate flex-1 group-hover:text-primary transition-colors">
                                        {template.name}
                                    </h4>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                        {template.category}
                                    </span>
                                </div>

                                {/* Tags */}
                                {template.tags && template.tags.length > 0 && (
                                    <div className="flex gap-1 mt-1 overflow-hidden h-4">
                                        {template.tags.slice(0, 2).map((tag, i) => (
                                            <span key={i} className="text-[10px] text-muted-foreground bg-muted/50 px-1 rounded whitespace-nowrap">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
