import React from 'react';
import FeaturedNewsCard from './FeaturedNewsCard';
import GridNewsCard from './GridNewsCard';
import ListNewsCard from './ListNewsCard';
import WidgetNewsCard from './WidgetNewsCard';
import CompactNewsCard from './CompactNewsCard';
import MixedNewsCard from './MixedNewsCard';
import { NewsCardData } from '@/lib/newsCardUtils';
import { LayoutAssignment } from '@/lib/layoutAssigner';

interface MixedLayoutGridProps {
  articles: NewsCardData[];
  assignments: LayoutAssignment[];
  relatedArticlesMap?: Map<string, NewsCardData[]>; // For mixed layouts
}

export default function MixedLayoutGrid({ 
  articles, 
  assignments,
  relatedArticlesMap = new Map()
}: MixedLayoutGridProps) {
  const renderCard = (article: NewsCardData, assignment: LayoutAssignment, index: number) => {
    switch (assignment.layout) {
      case 'featured':
        return <FeaturedNewsCard key={article.id} data={article} />;
      
      case 'grid':
        return (
          <div key={article.id} className={assignment.span === 1 ? '' : 'col-span-2'}>
            <GridNewsCard data={article} />
          </div>
        );
      
      case 'list':
        return <ListNewsCard key={article.id} data={article} />;
      
      case 'widget':
        return <WidgetNewsCard key={article.id} data={article} />;
      
      case 'compact':
        return <CompactNewsCard key={article.id} data={article} />;
      
      case 'mixed':
        const related = relatedArticlesMap.get(article.id) || [];
        return (
          <MixedNewsCard 
            key={article.id} 
            mainArticle={article} 
            relatedArticles={related}
          />
        );
      
      default:
        return <ListNewsCard key={article.id} data={article} />;
    }
  };

  // Group grid items together
  const renderLayout = () => {
    const elements: React.ReactNode[] = [];
    let i = 0;
    let gridGroup: { article: NewsCardData; assignment: LayoutAssignment; index: number }[] = [];

    while (i < articles.length) {
      const article = articles[i];
      const assignment = assignments[i] || { layout: 'list' };

      if (assignment.layout === 'grid') {
        gridGroup.push({ article, assignment, index: i });
        
        // If we have 2 items or this is the last item, render the grid
        if (gridGroup.length === 2 || i === articles.length - 1) {
          elements.push(
            <div key={`grid-${i}`} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {gridGroup.map(({ article, assignment, index }) => (
                <GridNewsCard key={article.id} data={article} />
              ))}
            </div>
          );
          gridGroup = [];
        }
      } else {
        // Render any pending grid items first
        if (gridGroup.length > 0) {
          elements.push(
            <div key={`grid-${i}`} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {gridGroup.map(({ article, assignment, index }) => (
                <GridNewsCard key={article.id} data={article} />
              ))}
            </div>
          );
          gridGroup = [];
        }

        // Render current item
        elements.push(
          <div key={article.id} className="mb-6">
            {renderCard(article, assignment, i)}
          </div>
        );
      }

      i++;
    }

    // Render any remaining grid items
    if (gridGroup.length > 0) {
      elements.push(
        <div key={`grid-final`} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {gridGroup.map(({ article, assignment, index }) => (
            <GridNewsCard key={article.id} data={article} />
          ))}
        </div>
      );
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {renderLayout()}
    </div>
  );
}

