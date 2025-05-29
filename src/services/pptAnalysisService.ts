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

// Enhanced PowerPoint parsing using raw extraction
export const analyzePowerPointFile = async (file: File): Promise<LessonStructure> => {
  try {
    console.log('=== STARTING ENHANCED POWERPOINT ANALYSIS ===');
    console.log(`Analyzing file: ${file.name} (${file.size} bytes)`);
    
    // Phase 1: Raw content extraction
    const rawContent = await extractRawPowerPointContent(file);
    console.log(`Raw extraction complete: ${rawContent.totalSlides} slides processed`);
    
    // Phase 2: Convert raw data to structured analysis
    const slides: SlideAnalysis[] = [];
    const designElements = {
      colors: new Set<string>(rawContent.themeColors),
      fonts: new Set<string>(),
      layouts: new Map<string, number>(),
      activityTypes: new Set<string>(),
      contentTypes: new Set<string>(),
    };
    
    // Process each raw slide
    for (const rawSlide of rawContent.slides) {
      console.log(`Processing slide ${rawSlide.slideNumber}...`);
      
      // Convert raw slide to structured analysis
      const slideAnalysis = convertRawSlideToAnalysis(rawSlide);
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
    
    console.log(`Analysis complete: ${slides.length} slides analyzed`);
    console.log(`Activity types found: [${Array.from(designElements.activityTypes).join(', ')}]`);
    
    // Analyze pedagogical patterns from processed slides
    const pedagogicalAnalysis = analyzePedagogicalPatterns(slides);
    
    return {
      totalSlides: slides.length,
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
    console.error('Enhanced PowerPoint analysis failed:', error);
    throw new Error(`Failed to analyze PowerPoint file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const convertRawSlideToAnalysis = (rawSlide: any): SlideAnalysis => {
  // Use enhanced activity type detection
  const activityType = categorizeActivityFromRawSlide(rawSlide);
  const contentType = determineContentTypeFromRaw(rawSlide);
  
  // Convert raw text elements to structured elements
  const elements: SlideElement[] = rawSlide.textElements.map((textEl: any, index: number) => ({
    type: 'text' as const,
    position: { x: 0, y: index * 30, width: 400, height: 25 },
    content: textEl.text,
    formatting: {
      fontSize: textEl.fontSize || 12,
      fontFamily: textEl.fontFamily || 'Arial',
      color: '#000000',
      alignment: 'left'
    }
  }));
  
  // Add image elements if detected
  if (rawSlide.hasImages) {
    elements.push({
      type: 'image',
      position: { x: 400, y: 100, width: 200, height: 150 },
      content: 'Image content',
      formatting: {},
      imageData: {
        src: 'placeholder',
        alt: 'Slide image',
        aspectRatio: 1.33
      }
    });
  }
  
  const layoutType = determineLayoutFromRaw(rawSlide);
  
  return {
    slideNumber: rawSlide.slideNumber,
    layout: layoutType,
    backgroundColor: '#FFFFFF',
    elements,
    designPatterns: {
      titlePosition: rawSlide.title ? 'top' : 'none',
      contentLayout: rawSlide.layoutHints.includes('text-heavy') ? 'text-focused' : 'balanced',
      imageAlignment: rawSlide.hasImages ? 'integrated' : 'none',
      colorScheme: [], // Will be populated from theme
      fontHierarchy: rawSlide.textElements
        .map((el: any) => el.fontFamily)
        .filter((font: string) => font)
        .filter((font: string, index: number, arr: string[]) => arr.indexOf(font) === index)
    },
    activityType,
    contentType
  };
};

const determineContentTypeFromRaw = (rawSlide: any): string => {
  const title = rawSlide.title.toLowerCase();
  const content = rawSlide.allText.toLowerCase();
  
  // Enhanced content type detection using raw data
  if (title.includes('objective') || content.includes('by the end')) {
    return 'Learning Objectives';
  }
  
  if (title.includes('introduction') || title.includes('welcome')) {
    return 'Introduction';
  }
  
  if (title.includes('vocabulary') || content.includes('new words')) {
    return 'Vocabulary Introduction';
  }
  
  if (title.includes('grammar') || content.includes('structure')) {
    return 'Grammar Point';
  }
  
  if (content.includes('practice') || content.includes('exercise')) {
    return 'Practice Activity';
  }
  
  if (title.includes('homework') || content.includes('assignment')) {
    return 'Homework/Conclusion';
  }
  
  if (title.includes('review') || content.includes('summary')) {
    return 'Review/Summary';
  }
  
  return 'Main Content';
};

const determineLayoutFromRaw = (rawSlide: any): string => {
  const { textElements, hasImages, layoutHints } = rawSlide;
  
  if (textElements.length === 1 && !hasImages) {
    return 'Title Slide';
  }
  
  if (layoutHints.includes('text-heavy')) {
    return 'Text Heavy';
  }
  
  if (hasImages && textElements.length > 0) {
    return 'Mixed Content';
  }
  
  if (hasImages) {
    return 'Visual Focused';
  }
  
  if (layoutHints.includes('bullets')) {
    return 'Bullet Points';
  }
  
  if (layoutHints.includes('table')) {
    return 'Table Layout';
  }
  
  return 'Standard Layout';
};

const analyzePedagogicalPatterns = (slides: SlideAnalysis[]) => {
  // Get all activity types directly from slides
  const activityTypes = slides
    .map(slide => slide.activityType)
    .filter(Boolean) as string[];
    
  const contentTypes = slides
    .map(slide => slide.contentType)
    .filter(Boolean) as string[];
  
  // Create lesson flow from slides
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
  
  // Get ALL unique activity types
  const uniqueActivityTypes = [...new Set(activityTypes)];
  
  console.log('=== ENHANCED PEDAGOGICAL ANALYSIS ===');
  console.log('All activity types found:', activityTypes);
  console.log('Unique activity types:', uniqueActivityTypes);
  console.log('Lesson flow:', lessonFlow);
  
  return {
    introductionStyle: contentTypes[0] || 'Direct Introduction',
    contentProgression: lessonFlow,
    activityTypes: uniqueActivityTypes,
    assessmentMethods: ['Formative Assessment'],
    conclusionStyle: contentTypes[contentTypes.length - 1] || 'Standard Conclusion'
  };
};

const extractLessonFlow = (slides: SlideAnalysis[]): string[] => {
  return slides.map((slide, index) => {
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
};

const extractLogoPositions = (slides: SlideAnalysis[]): string[] => {
  // Simple implementation - can be enhanced based on actual logo detection
  return ['top-right', 'header', 'footer'];
};

const extractImageStyles = (slides: SlideAnalysis[]): string[] => {
  const hasImages = slides.some(slide => 
    slide.elements.some(element => element.type === 'image')
  );
  
  if (hasImages) {
    return ['integrated', 'supporting', 'decorative'];
  }
  return ['minimal-visuals'];
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
