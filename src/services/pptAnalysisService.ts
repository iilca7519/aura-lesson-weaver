
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

// Activity keywords mapping (based on Python code)
const ACTIVITY_KEYWORDS = {
  'reading': 'Reading',
  'question': 'Question',
  'terms': 'Terms',
  'matching': 'Matching',
  'fill in the blanks': 'Fill in the Blanks',
  'fitb': 'Fill in the Blanks',
  'sentences': 'Sentences',
  'describing images': 'Describing Images',
  'vocabulary': 'Vocabulary',
  'discussion': 'Discussion',
  'warm up': 'Warm-up',
  'warm-up': 'Warm-up',
  'pair work': 'Pair Work',
  'group work': 'Group Work',
  'role play': 'Role Play',
  'listening': 'Listening',
  'writing': 'Writing',
  'speaking': 'Speaking',
  'grammar': 'Grammar',
  'practice': 'Practice',
  'exercise': 'Exercise',
  'game': 'Game',
  'homework': 'Homework',
  'review': 'Review',
  'brainstorm': 'Brainstorming',
  'presentation': 'Presentation'
};

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
          activityType: 'Content Slide',
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
          activityType: 'Content Slide',
          contentType: 'Main Content'
        });
        designElements.activityTypes.add('Content Slide');
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
  
  let slideTitle = '';
  
  console.log(`=== ANALYZING SLIDE ${slideNumber} ===`);
  
  // Strategy 1: Look for explicit title shapes (PowerPoint standard)
  // Check for title placeholders with type="title" or similar
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
    
    // Look through all shapes for text content
    const shapes = doc.querySelectorAll('p\\:sp, sp');
    
    for (const shape of shapes) {
      const textBody = shape.querySelector('p\\:txBody, txBody');
      if (!textBody) continue;
      
      // Get shape position
      const spPr = shape.querySelector('p\\:spPr, spPr');
      const xfrm = spPr?.querySelector('a\\:xfrm, xfrm');
      const off = xfrm?.querySelector('a\\:off, off');
      const topPosition = off ? parseInt(off.getAttribute('y') || '0') : 0;
      
      // Look through paragraphs and runs
      const paragraphs = textBody.querySelectorAll('a\\:p, p');
      for (const paragraph of paragraphs) {
        const runs = paragraph.querySelectorAll('a\\:r, r');
        
        for (const run of runs) {
          const textElement = run.querySelector('a\\:t, t');
          const text = textElement?.textContent?.trim();
          
          if (!text || text.length < 2) continue;
          
          // Get font size from run properties
          const rPr = run.querySelector('a\\:rPr, rPr');
          const sizeAttr = rPr?.getAttribute('sz');
          const fontSize = sizeAttr ? parseInt(sizeAttr) / 100 : 12; // PowerPoint stores font size * 100
          
          candidateTexts.push({
            text,
            fontSize,
            topPosition,
            shape
          });
        }
        
        // Also check for text directly in paragraph without runs
        const directText = paragraph.querySelector('a\\:t, t');
        if (directText && directText.textContent?.trim()) {
          const text = directText.textContent.trim();
          if (text.length >= 2) {
            candidateTexts.push({
              text,
              fontSize: 12, // default
              topPosition,
              shape
            });
          }
        }
      }
    }
    
    if (candidateTexts.length > 0) {
      // Sort by font size (descending) and then by position (ascending - higher on slide)
      candidateTexts.sort((a, b) => {
        if (Math.abs(a.fontSize - b.fontSize) > 2) {
          return b.fontSize - a.fontSize; // Larger font first
        }
        return a.topPosition - b.topPosition; // Higher position first
      });
      
      slideTitle = candidateTexts[0].text;
      console.log(`Found title via heuristic (fontSize: ${candidateTexts[0].fontSize}, position: ${candidateTexts[0].topPosition}): "${slideTitle}"`);
    }
  }
  
  // Strategy 3: Final fallback - get first significant text if still no title
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
      
      // Extract formatting if available
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
  console.log(`Slide ${slideNumber} - All text length: ${allText.length}`);
  
  // Extract activity types based on keywords (following Python approach)
  const activityTypes = extractActivityTypesFromSlide(slideTitle, allText);
  const primaryActivityType = activityTypes.length > 0 ? activityTypes.join(', ') : 'Content Slide';
  
  console.log(`Slide ${slideNumber} - Found activity types: [${activityTypes.join(', ')}]`);
  console.log(`Slide ${slideNumber} - Primary activity type: "${primaryActivityType}"`);
  
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
    activityType: primaryActivityType,
    contentType
  };
};

// New function to extract activity types based on keywords (following Python approach)
const extractActivityTypesFromSlide = (slideTitle: string, allText: string): string[] => {
  const foundActivities = new Set<string>();
  
  // Combine title and all text for comprehensive search
  const combinedText = (slideTitle + ' ' + allText).toLowerCase();
  
  console.log(`Searching for activities in: "${combinedText.substring(0, 200)}..."`);
  
  // Check for activity keywords
  for (const [keyword, activity] of Object.entries(ACTIVITY_KEYWORDS)) {
    if (combinedText.includes(keyword.toLowerCase())) {
      foundActivities.add(activity);
      console.log(`Found activity "${activity}" via keyword "${keyword}"`);
    }
  }
  
  // Special case for copyright slides - exclude Reading activity
  if (combinedText.includes('copyright') && combinedText.includes('lessonspeak')) {
    foundActivities.delete('Reading');
    console.log('Excluded Reading activity due to copyright content');
  }
  
  // Return sorted array of found activities
  const activities = Array.from(foundActivities).sort();
  return activities.length > 0 ? activities : ['Content Slide'];
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
