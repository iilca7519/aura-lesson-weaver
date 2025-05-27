interface SlideElement {
  type: 'text' | 'image' | 'shape' | 'chart' | 'table';
  position: { x: number; y: number; width: number; height: number };
  content: string;
  formatting: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    alignment?: string;
  };
  imageData?: {
    src: string;
    alt: string;
    aspectRatio: number;
  };
}

interface SlideAnalysis {
  slideNumber: number;
  layout: string;
  backgroundColor: string;
  elements: SlideElement[];
  designPatterns: {
    titlePosition: string;
    contentLayout: string;
    imageAlignment: string;
    colorScheme: string[];
    fontHierarchy: string[];
  };
  activityType?: string;
  contentType?: string;
}

interface LessonStructure {
  totalSlides: number;
  lessonFlow: string[];
  commonLayouts: { [key: string]: number };
  designSystem: {
    primaryColors: string[];
    secondaryColors: string[];
    fontFamilies: string[];
    logoPositions: string[];
    imageStyles: string[];
  };
  pedagogicalPatterns: {
    introductionStyle: string;
    contentProgression: string[];
    activityTypes: string[];
    assessmentMethods: string[];
    conclusionStyle: string;
  };
}

export const analyzeSlideContent = async (slideXml: string, slideNumber: number): Promise<SlideAnalysis> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXml, 'text/xml');
  
  const elements: SlideElement[] = [];
  const colorScheme: string[] = [];
  const fontHierarchy: string[] = [];
  
  let slideTitle = '';
  
  console.log(`=== ANALYZING SLIDE ${slideNumber} ===`);
  
  // Strategy 1: Look for explicit title shapes (PowerPoint standard)
  const titlePlaceholders = doc.querySelectorAll('p\\:ph[type="title"], p\\:ph[type="ctrTitle"], ph[type="title"], ph[type="ctrTitle"]');
  
  if (titlePlaceholders.length > 0) {
    for (const placeholder of titlePlaceholders) {
      const parentShape = placeholder.closest('p\\:sp') || placeholder.closest('sp');
      if (parentShape) {
        const textBody = parentShape.querySelector('p\\:txBody, txBody');
        if (textBody) {
          const textElements = textBody.querySelectorAll('a\\:t, t');
          const titleTexts = Array.from(textElements)
            .map(el => el.textContent?.trim())
            .filter(Boolean);
          if (titleTexts.length > 0) {
            slideTitle = titleTexts.join(' ').trim();
            console.log(`Found title via title placeholder: "${slideTitle}"`);
            break;
          }
        }
      }
    }
  }
  
  // Strategy 2: If no title found, use heuristic approach (largest font or highest position)
  if (!slideTitle) {
    const candidateTexts: Array<{
      text: string;
      fontSize: number;
      topPosition: number;
      shape: Element;
    }> = [];
    
    const shapes = doc.querySelectorAll('p\\:sp, sp');
    
    for (const shape of shapes) {
      const textBody = shape.querySelector('p\\:txBody, txBody');
      if (!textBody) continue;
      
      const spPr = shape.querySelector('p\\:spPr, spPr');
      const xfrm = spPr?.querySelector('a\\:xfrm, xfrm');
      const off = xfrm?.querySelector('a\\:off, off');
      const topPosition = off ? parseInt(off.getAttribute('y') || '0') : 0;
      
      const paragraphs = textBody.querySelectorAll('a\\:p, p');
      for (const paragraph of paragraphs) {
        const runs = paragraph.querySelectorAll('a\\:r, r');
        
        for (const run of runs) {
          const textElement = run.querySelector('a\\:t, t');
          const text = textElement?.textContent?.trim();
          
          if (!text || text.length < 2) continue;
          
          const rPr = run.querySelector('a\\:rPr, rPr');
          const sizeAttr = rPr?.getAttribute('sz');
          const fontSize = sizeAttr ? parseInt(sizeAttr) / 100 : 12;
          
          candidateTexts.push({
            text,
            fontSize,
            topPosition,
            shape
          });
        }
        
        const directText = paragraph.querySelector('a\\:t, t');
        if (directText && directText.textContent?.trim()) {
          const text = directText.textContent.trim();
          if (text.length >= 2) {
            candidateTexts.push({
              text,
              fontSize: 12,
              topPosition,
              shape
            });
          }
        }
      }
    }
    
    if (candidateTexts.length > 0) {
      candidateTexts.sort((a, b) => {
        if (Math.abs(a.fontSize - b.fontSize) > 2) {
          return b.fontSize - a.fontSize;
        }
        return a.topPosition - b.topPosition;
      });
      
      slideTitle = candidateTexts[0].text;
      console.log(`Found title via heuristic (fontSize: ${candidateTexts[0].fontSize}, position: ${candidateTexts[0].topPosition}): "${slideTitle}"`);
    }
  }
  
  // Strategy 3: Final fallback
  if (!slideTitle) {
    const allTextElements = doc.querySelectorAll('a\\:t, t');
    for (const textEl of allTextElements) {
      const text = textEl.textContent?.trim();
      if (text && text.length > 2 && text.length < 100) {
        slideTitle = text;
        console.log(`Found title via fallback: "${slideTitle}"`);
        break;
      }
    }
  }
  
  // Collect all text for content analysis
  let allText = '';
  const textElements = doc.querySelectorAll('a\\:t, t');
  textElements.forEach((element, index) => {
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length > 1) {
      allText += textContent.toLowerCase() + ' ';
      
      const runParent = element.closest('a\\:r, r');
      const rPr = runParent?.querySelector('a\\:rPr, rPr');
      const sizeAttr = rPr?.getAttribute('sz');
      const fontSize = sizeAttr ? parseInt(sizeAttr) / 100 : 12;
      const fontFamily = rPr?.getAttribute('typeface') || 'Arial';
      
      fontHierarchy.push(fontFamily);
      
      elements.push({
        type: 'text',
        position: { x: 0, y: index * 20, width: 200, height: 20 },
        content: textContent,
        formatting: {
          fontSize,
          fontFamily,
          color: '#000000',
          alignment: 'left'
        }
      });
    }
  });
  
  console.log(`Slide ${slideNumber} - Final extracted title: "${slideTitle}"`);
  
  // Use the title directly as the activity type (no keyword mapping)
  const activityType = slideTitle || 'Content Slide';
  
  console.log(`Slide ${slideNumber} - Activity type: "${activityType}"`);
  
  const contentType = determineContentType(allText);
  const layoutType = determineLayoutType(elements);
  
  return {
    slideNumber,
    layout: layoutType,
    backgroundColor: extractBackgroundColor(doc),
    elements,
    designPatterns: {
      titlePosition: determineTitlePosition(elements),
      contentLayout: determineContentLayout(elements),
      imageAlignment: determineImageAlignment(elements),
      colorScheme: [...new Set(colorScheme)],
      fontHierarchy: [...new Set(fontHierarchy)]
    },
    activityType,
    contentType
  };
};

const determineContentType = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('objective') || lowerText.includes('goal') || 
      lowerText.includes('aim') || lowerText.includes('by the end')) {
    return 'Learning Objectives';
  }
  
  if (lowerText.includes('introduction') || lowerText.includes('welcome') || 
      lowerText.includes('today we will') || lowerText.includes('warm up')) {
    return 'Introduction';
  }
  
  if (lowerText.includes('vocabulary') || lowerText.includes('new words') || 
      lowerText.includes('key terms')) {
    return 'Vocabulary Introduction';
  }
  
  if (lowerText.includes('grammar') || lowerText.includes('structure') || 
      lowerText.includes('language point')) {
    return 'Grammar Point';
  }
  
  if (lowerText.includes('practice') || lowerText.includes('exercise') || 
      lowerText.includes('try this')) {
    return 'Practice Activity';
  }
  
  if (lowerText.includes('homework') || lowerText.includes('assignment') || 
      lowerText.includes('next time') || lowerText.includes('for next class')) {
    return 'Homework/Conclusion';
  }
  
  if (lowerText.includes('review') || lowerText.includes('summary') || 
      lowerText.includes('recap') || lowerText.includes('what we learned')) {
    return 'Review/Summary';
  }
  
  return 'Main Content';
};

const extractThemeColors = (themeXml: string, colorSet: Set<string>) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(themeXml, 'text/xml');
  
  const colors = doc.querySelectorAll('*[val]');
  colors.forEach(color => {
    const val = color.getAttribute('val');
    if (val && val.match(/^[0-9A-Fa-f]{6}$/)) {
      colorSet.add('#' + val);
    }
  });
};

const determineLayoutType = (elements: SlideElement[]): string => {
  const textElements = elements.filter(e => e.type === 'text');
  const imageElements = elements.filter(e => e.type === 'image');
  
  if (textElements.length === 1 && imageElements.length === 0) {
    return 'Title Slide';
  }
  if (textElements.length > 3 && imageElements.length === 0) {
    return 'Text Heavy';
  }
  if (imageElements.length > 0 && textElements.length > 0) {
    return 'Mixed Content';
  }
  if (imageElements.length > 1) {
    return 'Visual Focused';
  }
  return 'Standard Layout';
};

const extractBackgroundColor = (doc: Document): string => {
  const bgFill = doc.querySelector('p\\:bg, a\\:bgFillStyleLst');
  if (bgFill) {
    const solidFill = bgFill.querySelector('a\\:solidFill a\\:srgbClr');
    if (solidFill) {
      return '#' + solidFill.getAttribute('val');
    }
  }
  return '#FFFFFF';
};

const determineTitlePosition = (elements: SlideElement[]): string => {
  const textElements = elements.filter(e => e.type === 'text');
  if (textElements.length === 0) return 'none';
  
  const firstText = textElements[0];
  if (firstText.position.y < 100) return 'top';
  if (firstText.position.y > 300) return 'bottom';
  return 'center';
};

const determineContentLayout = (elements: SlideElement[]): string => {
  const contentElements = elements.filter(e => e.type !== 'text' || elements.indexOf(e) > 0);
  if (contentElements.length === 0) return 'text-only';
  if (contentElements.length === 1) return 'single-focus';
  return 'multi-element';
};

const determineImageAlignment = (elements: SlideElement[]): string => {
  const imageElements = elements.filter(e => e.type === 'image');
  if (imageElements.length === 0) return 'none';
  
  const avgX = imageElements.reduce((sum, img) => sum + img.position.x, 0) / imageElements.length;
  if (avgX < 200) return 'left-aligned';
  if (avgX > 600) return 'right-aligned';
  return 'center-aligned';
};

const extractLessonFlow = (slides: SlideAnalysis[]): string[] => {
  return slides.map(slide => slide.activityType || slide.contentType || 'Content Slide');
};

const extractLogoPositions = (slides: SlideAnalysis[]): string[] => {
  const positions: string[] = [];
  
  slides.forEach(slide => {
    slide.elements.forEach(element => {
      if (element.type === 'image' && element.imageData) {
        const { x, y } = element.position;
        if (x < 100 && y < 100) positions.push('top-left');
        else if (x > 600 && y < 100) positions.push('top-right');
        else if (y < 100) positions.push('header-area');
        else if (y > 400) positions.push('footer-area');
      }
    });
  });
  
  return [...new Set(positions)];
};

const extractImageStyles = (slides: SlideAnalysis[]): string[] => {
  const styles: string[] = [];
  
  const hasImages = slides.some(slide => 
    slide.elements.some(el => el.type === 'image')
  );
  
  if (hasImages) {
    styles.push('contextual-images', 'professional-layout');
  } else {
    styles.push('text-focused', 'minimal-visuals');
  }
  
  return styles;
};

const analyzePedagogicalPatterns = (slides: SlideAnalysis[]) => {
  // Get all activity types directly from slides
  const activityTypes = slides
    .map(slide => slide.activityType)
    .filter(Boolean) as string[];
    
  const contentTypes = slides
    .map(slide => slide.contentType)
    .filter(Boolean) as string[];
  
  // Create actual lesson flow from slides
  const lessonFlow = slides.map((slide, index) => {
    if (slide.activityType && slide.activityType !== 'Content Slide') {
      return slide.activityType;
    }
    if (slide.contentType && slide.contentType !== 'Main Content') {
      return slide.contentType;
    }
    if (index === 0) return 'Introduction';
    if (index === slides.length - 1) return 'Conclusion';
    return 'Content Development';
  });
  
  // Get ALL unique activity types - don't filter any out
  const uniqueActivityTypes = [...new Set(activityTypes)];
  
  console.log('=== PEDAGOGICAL ANALYSIS ===');
  console.log('All activity types found:', activityTypes);
  console.log('Unique activity types:', uniqueActivityTypes);
  console.log('Total unique activity types:', uniqueActivityTypes.length);
  
  return {
    introductionStyle: contentTypes[0] || 'Direct Introduction',
    contentProgression: lessonFlow,
    activityTypes: uniqueActivityTypes, // Keep ALL unique activity types
    assessmentMethods: ['Formative Assessment'],
    conclusionStyle: contentTypes[contentTypes.length - 1] || 'Standard Conclusion'
  };
};

export const aggregateAnalysis = (analyses: LessonStructure[]): any => {
  const totalSlides = analyses.reduce((sum, analysis) => sum + analysis.totalSlides, 0);
  const totalLessons = analyses.length;
  
  console.log('=== AGGREGATING ANALYSIS ===');
  console.log('Total lessons:', totalLessons);
  console.log('Total slides:', totalSlides);
  
  // Aggregate ALL activity types found across all files - don't filter anything
  const allActivityTypes = analyses.flatMap(a => a.pedagogicalPatterns.activityTypes);
  const uniqueActivityTypes = [...new Set(allActivityTypes)];
  
  console.log('All activity types across files:', allActivityTypes);
  console.log('Unique activity types:', uniqueActivityTypes);
  console.log('Total unique activity types:', uniqueActivityTypes.length);
  
  // Get actual lesson flow patterns
  const allFlowPatterns = analyses.flatMap(a => a.pedagogicalPatterns.contentProgression);
  const uniqueFlowPatterns = [...new Set(allFlowPatterns)];
  
  // Aggregate fonts (filter out defaults)
  const allFonts = analyses.flatMap(a => a.designSystem.fontFamilies);
  const uniqueFonts = [...new Set(allFonts)].filter(font => font && font !== 'Arial' && font !== '');
  
  // Aggregate layouts
  const allLayouts = analyses.flatMap(a => Object.entries(a.commonLayouts));
  const layoutFrequency = allLayouts.reduce((acc, [layout, count]) => {
    acc[layout] = (acc[layout] || 0) + count;
    return acc;
  }, {} as Record<string, number>);

  return {
    overview: {
      totalLessons,
      totalSlides,
      averageSlidesPerLesson: totalSlides > 0 ? Math.round(totalSlides / totalLessons) : 0,
      analysisDate: new Date().toISOString().split('T')[0]
    },
    designSystem: {
      preferredFonts: uniqueFonts.length > 0 ? uniqueFonts.slice(0, 3) : ['Standard system fonts'],
      commonLayouts: Object.entries(layoutFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 4)
        .map(([layout, count]) => ({ 
          layout, 
          usage: totalSlides > 0 ? Math.round((count / totalSlides) * 100) : 0 
        }))
    },
    pedagogicalInsights: {
      teachingStyle: 'Interactive and systematic approach with varied activities',
      preferredActivityTypes: uniqueActivityTypes, // Use ALL unique activity types
      lessonStructurePattern: uniqueFlowPatterns.length > 0 ? uniqueFlowPatterns.slice(0, 6) : [
        'Introduction', 'Content Presentation', 'Practice Activities', 'Assessment'
      ],
      assessmentApproach: 'Multi-modal assessment through activities and discussion'
    },
    visualPatterns: {
      imageUsage: analyses.some(a => a.designSystem.imageStyles.length > 0) ? 
        'Strategic use of visuals to support content' : 'Text-focused with minimal visuals',
      spacingPattern: 'Organized layout with logical progression',
      textFormatting: 'Clear hierarchy with readable typography'
    }
  };
};
