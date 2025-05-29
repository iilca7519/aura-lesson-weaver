
// Raw PowerPoint content extraction using regex patterns
interface RawTextElement {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  position?: { x: number; y: number };
  isTitle?: boolean;
  hierarchy: number; // 1 = title, 2 = subtitle, 3+ = content
}

interface RawSlideContent {
  slideNumber: number;
  xmlContent: string;
  textElements: RawTextElement[];
  title: string;
  allText: string;
  hasImages: boolean;
  hasShapes: boolean;
  layoutHints: string[];
}

interface PowerPointStructure {
  slides: RawSlideContent[];
  totalSlides: number;
  themeColors: string[];
  masterLayouts: string[];
}

// PowerPoint XML namespace patterns
const XML_PATTERNS = {
  // Text content patterns
  TEXT_CONTENT: /<a:t[^>]*>([^<]+)<\/a:t>/g,
  TEXT_WITH_FORMATTING: /<a:r[^>]*>.*?<a:rPr[^>]*sz="(\d+)"[^>]*>.*?<a:t[^>]*>([^<]+)<\/a:t>/g,
  
  // Title detection patterns
  TITLE_PLACEHOLDER: /<p:ph[^>]*type="title"[^>]*>/g,
  TITLE_SHAPE: /<p:sp[^>]*>[\s\S]*?<p:nvPr>[\s\S]*?<p:ph[^>]*type="title"[\s\S]*?<\/p:sp>/g,
  
  // Shape and positioning
  SHAPE_TRANSFORM: /<a:xfrm[^>]*>[\s\S]*?<a:off[^>]*x="(\d+)"[^>]*y="(\d+)"[^>]*>[\s\S]*?<\/a:xfrm>/g,
  SHAPE_SIZE: /<a:ext[^>]*cx="(\d+)"[^>]*cy="(\d+)"[^>]*>/g,
  
  // Font and formatting
  FONT_SIZE: /sz="(\d+)"/g,
  FONT_FAMILY: /typeface="([^"]+)"/g,
  
  // Layout and content type hints
  IMAGE_REFERENCE: /<p:pic[^>]*>|<a:blip[^>]*>/g,
  BULLET_POINTS: /<a:buChar[^>]*>|<a:buAutoNum[^>]*>/g,
  TABLE_STRUCTURE: /<a:tbl[^>]*>/g,
};

export const extractRawPowerPointContent = async (file: File): Promise<PowerPointStructure> => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    
    console.log('=== RAW EXTRACTION STARTED ===');
    
    // Get all slide files
    const slidesFolder = zipContent.folder('ppt/slides');
    if (!slidesFolder) {
      throw new Error('No slides folder found in PowerPoint file');
    }
    
    const slideFiles = [];
    for (const filename in slidesFolder.files) {
      const file = slidesFolder.files[filename];
      if (!file.dir && filename.match(/slide\d+\.xml$/)) {
        slideFiles.push(filename);
      }
    }
    
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
    
    console.log(`Found ${slideFiles.length} slide files for raw extraction`);
    
    const rawSlides: RawSlideContent[] = [];
    
    // Extract raw content from each slide
    for (let i = 0; i < slideFiles.length; i++) {
      const slideXml = await slidesFolder.file(slideFiles[i])?.async('text');
      if (!slideXml) continue;
      
      console.log(`Extracting raw content from slide ${i + 1}`);
      const rawSlide = extractSlideRawContent(slideXml, i + 1);
      rawSlides.push(rawSlide);
    }
    
    // Extract theme colors
    const themeColors = await extractThemeColors(zipContent);
    
    console.log('=== RAW EXTRACTION COMPLETE ===');
    console.log(`Extracted ${rawSlides.length} slides with ${rawSlides.reduce((sum, s) => sum + s.textElements.length, 0)} text elements`);
    
    return {
      slides: rawSlides,
      totalSlides: rawSlides.length,
      themeColors,
      masterLayouts: ['Standard', 'Title Slide', 'Content Slide'] // Default layouts
    };
    
  } catch (error) {
    console.error('Raw extraction failed:', error);
    throw new Error(`Raw PowerPoint extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const extractSlideRawContent = (xmlContent: string, slideNumber: number): RawSlideContent => {
  console.log(`--- Processing slide ${slideNumber} ---`);
  
  // Extract all text elements with formatting
  const textElements: RawTextElement[] = [];
  let allText = '';
  
  // Method 1: Extract text with formatting info
  const textWithFormatting = [...xmlContent.matchAll(XML_PATTERNS.TEXT_WITH_FORMATTING)];
  textWithFormatting.forEach(match => {
    const fontSize = parseInt(match[1]) / 100; // PowerPoint stores font size * 100
    const text = match[2].trim();
    
    if (text && text.length > 1) {
      textElements.push({
        text,
        fontSize,
        hierarchy: fontSize > 24 ? 1 : fontSize > 18 ? 2 : 3,
        isTitle: fontSize > 24
      });
      allText += text.toLowerCase() + ' ';
    }
  });
  
  // Method 2: Extract plain text (fallback)
  if (textElements.length === 0) {
    const plainText = [...xmlContent.matchAll(XML_PATTERNS.TEXT_CONTENT)];
    plainText.forEach((match, index) => {
      const text = match[1].trim();
      if (text && text.length > 1) {
        textElements.push({
          text,
          hierarchy: index === 0 ? 1 : 3,
          isTitle: index === 0
        });
        allText += text.toLowerCase() + ' ';
      }
    });
  }
  
  // Extract title using multiple strategies
  const title = extractSlideTitle(xmlContent, textElements);
  
  // Detect content features
  const hasImages = XML_PATTERNS.IMAGE_REFERENCE.test(xmlContent);
  const hasShapes = xmlContent.includes('<p:sp>');
  const hasBullets = XML_PATTERNS.BULLET_POINTS.test(xmlContent);
  const hasTable = XML_PATTERNS.TABLE_STRUCTURE.test(xmlContent);
  
  const layoutHints = [];
  if (hasImages) layoutHints.push('images');
  if (hasBullets) layoutHints.push('bullets');
  if (hasTable) layoutHints.push('table');
  if (textElements.length > 5) layoutHints.push('text-heavy');
  
  console.log(`Slide ${slideNumber}: Title="${title}", Text elements=${textElements.length}, Features=[${layoutHints.join(', ')}]`);
  
  return {
    slideNumber,
    xmlContent,
    textElements,
    title,
    allText: allText.trim(),
    hasImages,
    hasShapes,
    layoutHints
  };
};

const extractSlideTitle = (xmlContent: string, textElements: RawTextElement[]): string => {
  // Strategy 1: Find title placeholder
  const titlePlaceholder = XML_PATTERNS.TITLE_SHAPE.exec(xmlContent);
  if (titlePlaceholder) {
    const titleText = [...titlePlaceholder[0].matchAll(XML_PATTERNS.TEXT_CONTENT)];
    if (titleText.length > 0) {
      const title = titleText.map(match => match[1]).join('').trim();
      if (title) {
        console.log(`Title found via placeholder: "${title}"`);
        return title;
      }
    }
  }
  
  // Strategy 2: Largest font size
  const titleElements = textElements.filter(el => el.isTitle || el.hierarchy === 1);
  if (titleElements.length > 0) {
    const title = titleElements[0].text;
    console.log(`Title found via font size: "${title}"`);
    return title;
  }
  
  // Strategy 3: First text element
  if (textElements.length > 0) {
    const title = textElements[0].text;
    console.log(`Title found via first element: "${title}"`);
    return title;
  }
  
  console.log('No title found');
  return '';
};

const extractThemeColors = async (zipContent: any): Promise<string[]> => {
  const colors: string[] = [];
  
  try {
    const themeFolder = zipContent.folder('ppt/theme');
    if (themeFolder) {
      const themeFiles = Object.keys(themeFolder.files).filter(name => name.endsWith('.xml'));
      for (const themeFile of themeFiles) {
        const themeXml = await themeFolder.file(themeFile)?.async('text');
        if (themeXml) {
          const colorMatches = themeXml.match(/val="([0-9A-Fa-f]{6})"/g);
          if (colorMatches) {
            colorMatches.forEach(match => {
              const color = match.match(/val="([0-9A-Fa-f]{6})"/)?.[1];
              if (color) colors.push(`#${color}`);
            });
          }
        }
      }
    }
  } catch (error) {
    console.warn('Could not extract theme colors:', error);
  }
  
  return [...new Set(colors)].slice(0, 6); // Return unique colors, max 6
};
