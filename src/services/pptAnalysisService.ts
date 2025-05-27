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
    
    // More comprehensive slide detection - look for any slide files
    const slideFiles = [];
    for (const filename in slidesFolder.files) {
      const file = slidesFolder.files[filename];
      // Look for slide files - they can be slide1.xml, slide2.xml, etc.
      // Also check for files that end with .xml and contain "slide" in the name
      if (!file.dir && (
        filename.match(/^slide\d+\.xml$/) ||
        filename.match(/slide.*\.xml$/) ||
        filename.includes('slide') && filename.endsWith('.xml')
      )) {
        slideFiles.push(filename);
      }
    }
    
    // If no slides found with strict pattern, be more liberal
    if (slideFiles.length === 0) {
      for (const filename in slidesFolder.files) {
        const file = slidesFolder.files[filename];
        if (!file.dir && filename.endsWith('.xml')) {
          slideFiles.push(filename);
        }
      }
    }
    
    // Sort slides numerically
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
    
    console.log(`Analyzing ${file.name}: Found ${slideFiles.length} actual slides:`, slideFiles);
    
    const slides: SlideAnalysis[] = [];
    const designElements = {
      colors: new Set<string>(),
      fonts: new Set<string>(),
      layouts: new Map<string, number>(),
      activityTypes: new Set<string>(),
      contentTypes: new Set<string>(),
    };
    
    // Parse each slide for real content
    for (let i = 0; i < slideFiles.length; i++) {
      try {
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
      } catch (error) {
        console.error(`Error parsing slide ${i + 1}:`, error);
        // Still count the slide even if parsing fails
        slides.push({
          slideNumber: i + 1,
          layout: 'Unknown Layout',
          backgroundColor: '#FFFFFF',
          elements: [],
          designPatterns: {
            titlePosition: 'top',
            contentLayout: 'standard',
            imageAlignment: 'none',
            colorScheme: [],
            fontHierarchy: []
          },
          activityType: 'Content Presentation',
          contentType: 'Main Content'
        });
      }
    }
    
    // If no slides were successfully parsed but files exist, create placeholder slides
    if (slides.length === 0 && slideFiles.length > 0) {
      for (let i = 0; i < slideFiles.length; i++) {
        slides.push({
          slideNumber: i + 1,
          layout: 'Standard Layout',
          backgroundColor: '#FFFFFF',
          elements: [],
          designPatterns: {
            titlePosition: 'top',
            contentLayout: 'standard',
            imageAlignment: 'none',
            colorScheme: [],
            fontHierarchy: []
          },
          activityType: 'Content Presentation',
          contentType: 'Main Content'
        });
        designElements.activityTypes.add('Content Presentation');
        designElements.contentTypes.add('Main Content');
      }
    }
    
    // Extract theme colors from theme files
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
      totalSlides: slides.length, // Actual counted slides
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
    throw new Error(`Failed to analyze PowerPoint file: ${error.message}`);
  }
};

const analyzeSlideContent = async (slideXml: string, slideNumber: number): Promise<SlideAnalysis> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXml, 'text/xml');
  
  const elements: SlideElement[] = [];
  const colorScheme: string[] = [];
  const fontHierarchy: string[] = [];
  
  // Extract all text content for comprehensive analysis
  let allText = '';
  let slideTitle = '';
  
  // Look for title elements first - these often contain activity types
  const titleElements = doc.querySelectorAll('p\\:ph[type="title"], p\\:ph[type="ctrTitle"], a\\:p:first-child');
  const textElements = doc.querySelectorAll('a\\:t, p\\:txBody, a\\:p');
  
  // Extract title specifically
  if (titleElements.length > 0) {
    const titleText = titleElements[0].textContent?.trim() || '';
    if (titleText && titleText.length > 1) {
      slideTitle = titleText;
    }
  }
  
  // If no title found in title elements, use first text element as potential title
  if (!slideTitle && textElements.length > 0) {
    const firstText = textElements[0].textContent?.trim() || '';
    if (firstText && firstText.length > 1 && firstText.length < 100) {
      slideTitle = firstText;
    }
  }
  
  textElements.forEach((element, index) => {
    const textContent = element.textContent?.trim();
    if (textContent && textContent.length > 1) {
      allText += textContent.toLowerCase() + ' ';
      
      // Extract formatting if available
      const fontSize = element.getAttribute('sz') ? parseInt(element.getAttribute('sz')!) / 100 : 12;
      const fontFamily = element.getAttribute('typeface') || 'Arial';
      
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
  
  // Use slide title as primary source for activity type, with fallback to content analysis
  const activityType = slideTitle ? determineActivityTypeFromTitle(slideTitle) : determineActivityType(allText);
  const contentType = determineContentType(allText);
  const layoutType = determineLayoutType(elements);
  
  console.log(`Slide ${slideNumber} - Title: "${slideTitle}" -> Activity Type: "${activityType}"`);
  
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

const determineActivityTypeFromTitle = (title: string): string => {
  const lowerTitle = title.toLowerCase().trim();
  
  console.log(`Analyzing title for activity type: "${title}"`);
  
  // Direct activity type matches from title
  if (lowerTitle.includes('warm up') || lowerTitle.includes('warm-up') || lowerTitle.includes('warmer')) {
    return 'Warm-up Activity';
  }
  
  if (lowerTitle.includes('discussion') || lowerTitle.includes('discuss')) {
    return 'Discussion Activity';
  }
  
  if (lowerTitle.includes('pair work') || lowerTitle.includes('pair activity') || lowerTitle.includes('pairs')) {
    return 'Pair Work';
  }
  
  if (lowerTitle.includes('group work') || lowerTitle.includes('group activity') || lowerTitle.includes('groups')) {
    return 'Group Activity';
  }
  
  if (lowerTitle.includes('role play') || lowerTitle.includes('roleplay') || lowerTitle.includes('role-play')) {
    return 'Role Playing';
  }
  
  if (lowerTitle.includes('vocabulary') || lowerTitle.includes('vocab')) {
    return 'Vocabulary Activity';
  }
  
  if (lowerTitle.includes('grammar') || lowerTitle.includes('language focus')) {
    return 'Grammar Activity';
  }
  
  if (lowerTitle.includes('listening') || lowerTitle.includes('listen')) {
    return 'Listening Activity';
  }
  
  if (lowerTitle.includes('reading') || lowerTitle.includes('read')) {
    return 'Reading Activity';
  }
  
  if (lowerTitle.includes('writing') || lowerTitle.includes('write')) {
    return 'Writing Activity';
  }
  
  if (lowerTitle.includes('speaking') || lowerTitle.includes('speak')) {
    return 'Speaking Activity';
  }
  
  if (lowerTitle.includes('practice') || lowerTitle.includes('drill')) {
    return 'Practice Activity';
  }
  
  if (lowerTitle.includes('game') || lowerTitle.includes('fun activity')) {
    return 'Game Activity';
  }
  
  if (lowerTitle.includes('presentation') || lowerTitle.includes('present')) {
    return 'Presentation Activity';
  }
  
  if (lowerTitle.includes('review') || lowerTitle.includes('revision')) {
    return 'Review Activity';
  }
  
  if (lowerTitle.includes('homework') || lowerTitle.includes('assignment')) {
    return 'Homework Assignment';
  }
  
  if (lowerTitle.includes('introduction') || lowerTitle.includes('intro')) {
    return 'Introduction';
  }
  
  if (lowerTitle.includes('objective') || lowerTitle.includes('aims') || lowerTitle.includes('goals')) {
    return 'Learning Objectives';
  }
  
  if (lowerTitle.includes('conclusion') || lowerTitle.includes('summary') || lowerTitle.includes('wrap up')) {
    return 'Conclusion';
  }
  
  if (lowerTitle.includes('brainstorm') || lowerTitle.includes('ideas')) {
    return 'Brainstorming Activity';
  }
  
  if (lowerTitle.includes('match') || lowerTitle.includes('matching')) {
    return 'Matching Activity';
  }
  
  if (lowerTitle.includes('gap fill') || lowerTitle.includes('fill in') || lowerTitle.includes('complete')) {
    return 'Gap Fill Activity';
  }
  
  // If title doesn't match specific patterns, use the title itself as activity type if it's descriptive
  if (lowerTitle.length > 3 && lowerTitle.length < 50) {
    // Capitalize first letter of each word for better presentation
    return title.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  return 'Content Presentation';
};

const determineActivityType = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  // More comprehensive activity detection with broader patterns
  if (lowerText.includes('discuss') || lowerText.includes('discussion') || lowerText.includes('talk about') || 
      lowerText.includes('share your thoughts') || lowerText.includes('what do you think') || 
      lowerText.includes('opinion') || lowerText.includes('debate')) {
    return 'Discussion Activity';
  }
  
  if (lowerText.includes('pair work') || lowerText.includes('work with partner') || 
      lowerText.includes('partner activity') || lowerText.includes('work in pairs') ||
      lowerText.includes('find a partner')) {
    return 'Pair Work';
  }
  
  if (lowerText.includes('group work') || lowerText.includes('in groups') || 
      lowerText.includes('team activity') || lowerText.includes('work together') ||
      lowerText.includes('form groups') || lowerText.includes('group of')) {
    return 'Group Activity';
  }
  
  if (lowerText.includes('role play') || lowerText.includes('roleplay') || 
      lowerText.includes('act out') || lowerText.includes('pretend you are') ||
      lowerText.includes('imagine you are') || lowerText.includes('scenario')) {
    return 'Role Playing';
  }
  
  if (lowerText.includes('match') || lowerText.includes('matching') || 
      lowerText.includes('connect the') || lowerText.includes('link the') ||
      lowerText.includes('pair up') || lowerText.includes('corresponds')) {
    return 'Matching Exercise';
  }
  
  if (lowerText.includes('fill in') || lowerText.includes('complete the') || 
      lowerText.includes('fill the blank') || lowerText.includes('gap fill') ||
      lowerText.includes('missing word') || lowerText.includes('blank')) {
    return 'Gap Fill Activity';
  }
  
  if (lowerText.includes('listen') || lowerText.includes('listening') || 
      lowerText.includes('audio') || lowerText.includes('hear the') ||
      lowerText.includes('sound') || lowerText.includes('recording')) {
    return 'Listening Activity';
  }
  
  if (lowerText.includes('read') || lowerText.includes('reading') || 
      lowerText.includes('passage') || lowerText.includes('text analysis') ||
      lowerText.includes('article') || lowerText.includes('story')) {
    return 'Reading Activity';
  }
  
  if (lowerText.includes('write') || lowerText.includes('writing') || 
      lowerText.includes('composition') || lowerText.includes('essay') ||
      lowerText.includes('paragraph') || lowerText.includes('journal')) {
    return 'Writing Activity';
  }
  
  if (lowerText.includes('vocabulary') || lowerText.includes('new words') || 
      lowerText.includes('definitions') || lowerText.includes('word study') ||
      lowerText.includes('meaning') || lowerText.includes('synonym') ||
      lowerText.includes('antonym')) {
    return 'Vocabulary Building';
  }
  
  if (lowerText.includes('question') || lowerText.includes('answer') || 
      lowerText.includes('quiz') || lowerText.includes('q&a') ||
      lowerText.includes('test') || lowerText.includes('check your understanding')) {
    return 'Q&A Session';
  }
  
  if (lowerText.includes('practice') || lowerText.includes('exercise') || 
      lowerText.includes('drill') || lowerText.includes('try this') ||
      lowerText.includes('let\'s practice') || lowerText.includes('your turn')) {
    return 'Practice Exercise';
  }
  
  if (lowerText.includes('present') || lowerText.includes('presentation') || 
      lowerText.includes('show') || lowerText.includes('demonstrate') ||
      lowerText.includes('explain to class') || lowerText.includes('share with')) {
    return 'Presentation Activity';
  }
  
  if (lowerText.includes('game') || lowerText.includes('play') || 
      lowerText.includes('fun activity') || lowerText.includes('competition') ||
      lowerText.includes('challenge') || lowerText.includes('race')) {
    return 'Game Activity';
  }
  
  if (lowerText.includes('homework') || lowerText.includes('assignment') || 
      lowerText.includes('for next class') || lowerText.includes('at home') ||
      lowerText.includes('take home')) {
    return 'Homework Assignment';
  }
  
  if (lowerText.includes('review') || lowerText.includes('summary') || 
      lowerText.includes('recap') || lowerText.includes('what we learned') ||
      lowerText.includes('remember') || lowerText.includes('recall')) {
    return 'Review Activity';
  }
  
  if (lowerText.includes('warm up') || lowerText.includes('warm-up') || 
      lowerText.includes('ice breaker') || lowerText.includes('getting started') ||
      lowerText.includes('opener')) {
    return 'Warm-up Activity';
  }
  
  if (lowerText.includes('brainstorm') || lowerText.includes('think of') || 
      lowerText.includes('come up with') || lowerText.includes('ideas') ||
      lowerText.includes('suggest')) {
    return 'Brainstorming';
  }
  
  // Check for instructional content patterns
  if (lowerText.includes('objective') || lowerText.includes('goal') || 
      lowerText.includes('aim') || lowerText.includes('by the end') ||
      lowerText.includes('learning outcomes')) {
    return 'Learning Objectives';
  }
  
  if (lowerText.includes('grammar') || lowerText.includes('structure') || 
      lowerText.includes('language point') || lowerText.includes('tense') ||
      lowerText.includes('verb') || lowerText.includes('noun')) {
    return 'Grammar Instruction';
  }
  
  // Default based on slide position and common patterns
  if (lowerText.includes('welcome') || lowerText.includes('hello') || 
      lowerText.includes('good morning') || lowerText.includes('introduction')) {
    return 'Introduction Slide';
  }
  
  if (lowerText.includes('thank you') || lowerText.includes('goodbye') || 
      lowerText.includes('see you next') || lowerText.includes('conclusion')) {
    return 'Conclusion Slide';
  }
  
  // Check content length and complexity to determine activity type
  if (lowerText.length > 200) {
    return 'Content Explanation';
  }
  
  if (lowerText.length < 50 && (lowerText.includes('?') || lowerText.includes('activity'))) {
    return 'Quick Activity';
  }
  
  return 'Content Presentation';
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
  const activityTypes = slides
    .map(slide => slide.activityType)
    .filter(Boolean) as string[];
    
  const contentTypes = slides
    .map(slide => slide.contentType)
    .filter(Boolean) as string[];
  
  // Create actual lesson flow from slides with better activity detection
  const lessonFlow = slides.map((slide, index) => {
    if (slide.activityType && slide.activityType !== 'Content Presentation') {
      return slide.activityType;
    }
    if (slide.contentType && slide.contentType !== 'Main Content') {
      return slide.contentType;
    }
    if (index === 0) return 'Introduction';
    if (index === slides.length - 1) return 'Conclusion';
    return 'Content Development';
  });
  
  // Get unique activity types, but don't filter out 'Content Presentation' if it's the only type
  const uniqueActivityTypes = [...new Set(activityTypes)];
  
  console.log('All activity types found:', activityTypes);
  console.log('Unique activity types:', uniqueActivityTypes);
  
  return {
    introductionStyle: contentTypes[0] || 'Direct Introduction',
    contentProgression: lessonFlow,
    activityTypes: uniqueActivityTypes,
    assessmentMethods: ['Formative Assessment'],
    conclusionStyle: contentTypes[contentTypes.length - 1] || 'Standard Conclusion'
  };
};

export const aggregateAnalysis = (analyses: LessonStructure[]): any => {
  const totalSlides = analyses.reduce((sum, analysis) => sum + analysis.totalSlides, 0);
  const totalLessons = analyses.length;
  
  console.log('Aggregating analysis - ACCURATE COUNT:', {
    totalLessons,
    totalSlides,
    breakdownPerFile: analyses.map((a, i) => ({ 
      file: i + 1, 
      slides: a.totalSlides 
    }))
  });
  
  // Aggregate all ACTUAL activity types found
  const allActivityTypes = analyses.flatMap(a => a.pedagogicalPatterns.activityTypes);
  const uniqueActivityTypes = [...new Set(allActivityTypes)].filter(type => type && type !== 'Content Presentation');
  
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
      totalSlides, // This is now accurate
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
      preferredActivityTypes: uniqueActivityTypes.length > 0 ? uniqueActivityTypes : ['Mixed teaching activities'],
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
