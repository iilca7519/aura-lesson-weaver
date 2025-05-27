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

// Enhanced PowerPoint parsing implementation
export const analyzePowerPointFile = async (file: File): Promise<LessonStructure> => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    const zipContent = await zip.loadAsync(file);
    
    // Get slides folder and count actual slides
    const slidesFolder = zipContent.folder('ppt/slides');
    if (!slidesFolder) {
      throw new Error('No slides found in PowerPoint file');
    }
    
    // Count actual slide files (.xml files, excluding rels and other metadata)
    const slideFiles = Object.keys(slidesFolder.files)
      .filter(name => name.match(/^slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });
    
    console.log(`Found ${slideFiles.length} slides in ${file.name}:`, slideFiles);
    
    const slides: SlideAnalysis[] = [];
    const designElements = {
      colors: new Set<string>(),
      fonts: new Set<string>(),
      layouts: new Map<string, number>(),
      activityTypes: new Set<string>(),
      contentTypes: new Set<string>(),
    };
    
    // Parse each slide
    for (let i = 0; i < slideFiles.length; i++) {
      const slideXml = await slidesFolder.file(slideFiles[i])?.async('text');
      if (!slideXml) continue;
      
      const slideAnalysis = await analyzeSlideContent(slideXml, i + 1);
      slides.push(slideAnalysis);
      
      // Aggregate design elements
      slideAnalysis.designPatterns.colorScheme.forEach(color => designElements.colors.add(color));
      slideAnalysis.designPatterns.fontHierarchy.forEach(font => designElements.fonts.add(font));
      
      if (slideAnalysis.activityType) {
        designElements.activityTypes.add(slideAnalysis.activityType);
      }
      if (slideAnalysis.contentType) {
        designElements.contentTypes.add(slideAnalysis.contentType);
      }
      
      const layoutCount = designElements.layouts.get(slideAnalysis.layout) || 0;
      designElements.layouts.set(slideAnalysis.layout, layoutCount + 1);
    }
    
    // Extract theme colors
    const themeFolder = zipContent.folder('ppt/theme');
    if (themeFolder) {
      const themeFiles = Object.keys(themeFolder.files).filter(name => name.endsWith('.xml'));
      for (const themeFile of themeFiles) {
        const themeXml = await themeFolder.file(themeFile)?.async('text');
        if (themeXml) {
          extractThemeColors(themeXml, designElements.colors);
        }
      }
    }
    
    // Analyze pedagogical patterns from slide sequence
    const pedagogicalAnalysis = analyzePedagogicalPatterns(slides);
    
    return {
      totalSlides: slides.length, // Use actual counted slides
      lessonFlow: extractLessonFlow(slides),
      commonLayouts: Object.fromEntries(designElements.layouts),
      designSystem: {
        primaryColors: Array.from(designElements.colors).slice(0, 3),
        secondaryColors: Array.from(designElements.colors).slice(3, 6),
        fontFamilies: Array.from(designElements.fonts).slice(0, 3),
        logoPositions: extractLogoPositions(slides),
        imageStyles: extractImageStyles(slides)
      },
      pedagogicalPatterns: {
        ...pedagogicalAnalysis,
        activityTypes: Array.from(designElements.activityTypes)
      }
    };
    
  } catch (error) {
    console.error('Error analyzing PowerPoint file:', error);
    throw new Error('Failed to analyze PowerPoint file: ' + error.message);
  }
};

const analyzeSlideContent = async (slideXml: string, slideNumber: number): Promise<SlideAnalysis> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXml, 'text/xml');
  
  const elements: SlideElement[] = [];
  const colorScheme: string[] = [];
  const fontHierarchy: string[] = [];
  
  // Extract all text content for analysis
  let allText = '';
  const textElements = doc.querySelectorAll('a\\:t, t');
  textElements.forEach((textEl, index) => {
    const text = textEl.textContent || '';
    if (text.trim()) {
      allText += text.toLowerCase() + ' ';
      
      // Find formatting information
      const runProps = textEl.closest('a\\:r')?.querySelector('a\\:rPr');
      const fontSize = runProps?.getAttribute('sz') ? parseInt(runProps.getAttribute('sz')!) / 100 : 12;
      const fontFamily = runProps?.querySelector('a\\:latin')?.getAttribute('typeface') || 'Arial';
      
      // Extract color information
      const solidFill = runProps?.querySelector('a\\:solidFill');
      let color = '#000000';
      if (solidFill) {
        const srgbClr = solidFill.querySelector('a\\:srgbClr');
        if (srgbClr) {
          color = '#' + srgbClr.getAttribute('val');
          colorScheme.push(color);
        }
      }
      
      fontHierarchy.push(fontFamily);
      
      elements.push({
        type: 'text',
        position: { x: 0, y: index * 20, width: 200, height: 20 },
        content: text,
        formatting: {
          fontSize,
          fontFamily,
          color,
          alignment: 'left'
        }
      });
    }
  });
  
  // Extract images
  const images = doc.querySelectorAll('pic\\:pic, p\\:pic');
  images.forEach((img, index) => {
    const blip = img.querySelector('a\\:blip');
    if (blip) {
      elements.push({
        type: 'image',
        position: { x: 100, y: 100 + index * 150, width: 200, height: 150 },
        content: 'Image',
        formatting: {},
        imageData: {
          src: 'data:image/png;base64,placeholder',
          alt: 'Slide image',
          aspectRatio: 4/3
        }
      });
    }
  });
  
  // Determine activity type from content
  const activityType = determineActivityType(allText);
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

const determineActivityType = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('discuss') || lowerText.includes('talk about') || lowerText.includes('share')) {
    return 'Discussion Activity';
  }
  if (lowerText.includes('pair') || lowerText.includes('partner')) {
    return 'Pair Work';
  }
  if (lowerText.includes('group') || lowerText.includes('team')) {
    return 'Group Activity';
  }
  if (lowerText.includes('role play') || lowerText.includes('act out')) {
    return 'Role Playing';
  }
  if (lowerText.includes('match') || lowerText.includes('connect') || lowerText.includes('link')) {
    return 'Matching Exercise';
  }
  if (lowerText.includes('complete') || lowerText.includes('fill in') || lowerText.includes('blank')) {
    return 'Gap Fill Activity';
  }
  if (lowerText.includes('listen') || lowerText.includes('audio') || lowerText.includes('hear')) {
    return 'Listening Activity';
  }
  if (lowerText.includes('read') || lowerText.includes('passage') || lowerText.includes('text')) {
    return 'Reading Activity';
  }
  if (lowerText.includes('write') || lowerText.includes('composition')) {
    return 'Writing Activity';
  }
  if (lowerText.includes('vocabulary') || lowerText.includes('words') || lowerText.includes('meaning')) {
    return 'Vocabulary Building';
  }
  if (lowerText.includes('question') || lowerText.includes('answer') || lowerText.includes('quiz')) {
    return 'Q&A Session';
  }
  
  return 'Content Presentation';
};

const determineContentType = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('objective') || lowerText.includes('goal') || lowerText.includes('aim')) {
    return 'Learning Objectives';
  }
  if (lowerText.includes('introduction') || lowerText.includes('welcome') || lowerText.includes('today')) {
    return 'Introduction';
  }
  if (lowerText.includes('vocabulary') || lowerText.includes('new words')) {
    return 'Vocabulary Introduction';
  }
  if (lowerText.includes('grammar') || lowerText.includes('structure')) {
    return 'Grammar Point';
  }
  if (lowerText.includes('practice') || lowerText.includes('exercise')) {
    return 'Practice Activity';
  }
  if (lowerText.includes('homework') || lowerText.includes('assignment') || lowerText.includes('next time')) {
    return 'Homework/Conclusion';
  }
  if (lowerText.includes('review') || lowerText.includes('summary')) {
    return 'Review/Summary';
  }
  
  return 'Main Content';
};

const extractThemeColors = (themeXml: string, colorSet: Set<string>) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(themeXml, 'text/xml');
  
  const colors = doc.querySelectorAll('a\\:srgbClr');
  colors.forEach(color => {
    const val = color.getAttribute('val');
    if (val) {
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
  if (textElements.length > 1 && imageElements.length === 0) {
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
  return slides.map(slide => slide.contentType || slide.activityType || 'Content Slide');
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
  }
  
  return styles;
};

const analyzePedagogicalPatterns = (slides: SlideAnalysis[]) => {
  const activityTypes = slides
    .map(slide => slide.activityType)
    .filter(Boolean) as string[];
    
  const contentTypes = slides
    .map(slide => slide.contentType)
    .filter(Boolean) as string[];
  
  const contentProgression = slides.map((slide, index) => {
    if (index === 0) return 'Introduction';
    if (index === slides.length - 1) return 'Conclusion';
    return slide.contentType || slide.activityType || 'Content Development';
  });
  
  // Determine assessment methods from content
  const assessmentMethods = [];
  const allText = slides.flatMap(slide => 
    slide.elements.filter(e => e.type === 'text').map(e => e.content.toLowerCase())
  ).join(' ');
  
  if (allText.includes('question') || allText.includes('quiz')) {
    assessmentMethods.push('Q&A Assessment');
  }
  if (allText.includes('discuss') || allText.includes('share')) {
    assessmentMethods.push('Discussion-based Assessment');
  }
  if (allText.includes('practice') || allText.includes('exercise')) {
    assessmentMethods.push('Practice-based Assessment');
  }
  
  return {
    introductionStyle: contentTypes[0] || 'Direct Introduction',
    contentProgression: [...new Set(contentProgression)],
    activityTypes: [...new Set(activityTypes)],
    assessmentMethods: assessmentMethods.length > 0 ? assessmentMethods : ['Observational Assessment'],
    conclusionStyle: contentTypes[contentTypes.length - 1] || 'Standard Conclusion'
  };
};

export const aggregateAnalysis = (analyses: LessonStructure[]): any => {
  const totalSlides = analyses.reduce((sum, analysis) => sum + analysis.totalSlides, 0);
  const totalLessons = analyses.length;
  
  console.log('Aggregating analysis:', {
    totalLessons,
    totalSlides,
    analyses: analyses.map(a => ({ totalSlides: a.totalSlides }))
  });
  
  // Aggregate all activity types
  const allActivityTypes = analyses.flatMap(a => a.pedagogicalPatterns.activityTypes);
  const uniqueActivityTypes = [...new Set(allActivityTypes)];
  
  // Aggregate colors with better filtering
  const allColors = analyses.flatMap(a => [...a.designSystem.primaryColors, ...a.designSystem.secondaryColors])
    .filter(color => color && color !== '#000000' && color !== '#FFFFFF');
  const uniqueColors = [...new Set(allColors)];
  
  // Aggregate fonts
  const allFonts = analyses.flatMap(a => a.designSystem.fontFamilies);
  const uniqueFonts = [...new Set(allFonts)].filter(font => font && font !== 'Arial');
  
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
      averageSlidesPerLesson: Math.round(totalSlides / totalLessons),
      analysisDate: new Date().toISOString().split('T')[0]
    },
    designSystem: {
      dominantColors: uniqueColors.slice(0, 4),
      preferredFonts: uniqueFonts.slice(0, 3),
      commonLayouts: Object.entries(layoutFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 4)
        .map(([layout, count]) => ({ layout, usage: Math.round((count / totalSlides) * 100) }))
    },
    pedagogicalInsights: {
      teachingStyle: 'Interactive and systematic approach with varied activities',
      preferredActivityTypes: uniqueActivityTypes,
      lessonStructurePattern: [
        'Lesson Introduction',
        'Content Presentation', 
        'Interactive Activities',
        'Practice & Application',
        'Assessment & Review',
        'Conclusion & Wrap-up'
      ],
      assessmentApproach: 'Multi-modal assessment through activities and discussion'
    },
    visualPatterns: {
      imageUsage: analyses.some(a => a.designSystem.imageStyles.length > 0) ? 
        'Strategic use of visuals to support content' : 'Text-focused with minimal visuals',
      logoPlacement: 'Consistent branding placement',
      textFormatting: 'Clear hierarchy with readable typography',
      spacingPattern: 'Organized layout with logical flow'
    }
  };
};
