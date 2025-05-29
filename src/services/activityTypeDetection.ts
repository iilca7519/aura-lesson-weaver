
// Enhanced activity type detection using structured raw PowerPoint data
interface RawTextElement {
  text: string;
  fontSize?: number;
  fontFamily?: string;
  position?: { x: number; y: number };
  isTitle?: boolean;
  hierarchy: number;
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

interface ActivityPattern {
  keywords: string[];
  category: string;
  priority: number;
}

// Comprehensive pedagogical activity patterns
const ACTIVITY_PATTERNS: ActivityPattern[] = [
  // Learning Structure
  { keywords: ['objective', 'goal', 'aim', 'by the end', 'will be able', 'learning outcomes'], category: 'Learning Objectives', priority: 10 },
  { keywords: ['welcome', 'introduction', 'warm up', 'ice breaker', 'getting started', 'let\'s begin'], category: 'Introduction', priority: 10 },
  
  // Language Skills
  { keywords: ['vocabulary', 'new words', 'key terms', 'lexis', 'word study', 'meaning'], category: 'Vocabulary Development', priority: 9 },
  { keywords: ['grammar', 'structure', 'language point', 'tense', 'syntax', 'form'], category: 'Grammar Focus', priority: 9 },
  { keywords: ['pronunciation', 'phonetics', 'sounds', 'intonation', 'stress', 'accent'], category: 'Pronunciation Practice', priority: 9 },
  
  // Interactive Activities
  { keywords: ['matching', 'match', 'pair up', 'connect', 'link'], category: 'Matching Activities', priority: 8 },
  { keywords: ['fill in', 'complete', 'gap fill', 'blank', 'missing', 'choose'], category: 'Gap Fill Activities', priority: 8 },
  { keywords: ['role play', 'roleplay', 'act out', 'scenario', 'dialogue', 'conversation'], category: 'Role Play', priority: 8 },
  { keywords: ['discussion', 'talk about', 'share', 'debate', 'opinion', 'think'], category: 'Discussion Activities', priority: 8 },
  
  // Skills Practice
  { keywords: ['listening', 'audio', 'hear', 'sound', 'listen to'], category: 'Listening Activities', priority: 8 },
  { keywords: ['reading', 'text', 'passage', 'article', 'read'], category: 'Reading Activities', priority: 8 },
  { keywords: ['writing', 'write', 'compose', 'essay', 'paragraph'], category: 'Writing Activities', priority: 8 },
  { keywords: ['speaking', 'present', 'tell', 'explain', 'describe'], category: 'Speaking Activities', priority: 8 },
  
  // Practice & Games
  { keywords: ['practice', 'exercise', 'drill', 'try this', 'activity', 'task'], category: 'Practice Activities', priority: 7 },
  { keywords: ['game', 'quiz', 'competition', 'challenge', 'play'], category: 'Interactive Games', priority: 7 },
  { keywords: ['group work', 'teamwork', 'collaborate', 'together', 'pairs'], category: 'Collaborative Learning', priority: 7 },
  
  // Assessment & Review
  { keywords: ['test', 'exam', 'assessment', 'check', 'evaluate'], category: 'Assessment', priority: 8 },
  { keywords: ['review', 'summary', 'recap', 'what we learned', 'consolidation'], category: 'Review & Summary', priority: 8 },
  { keywords: ['feedback', 'correction', 'error', 'mistake', 'check your work'], category: 'Feedback & Correction', priority: 7 },
  
  // Content Delivery
  { keywords: ['presentation', 'explanation', 'demonstration', 'show', 'example'], category: 'Content Presentation', priority: 6 },
  { keywords: ['homework', 'assignment', 'next time', 'for next class', 'take home'], category: 'Homework Assignment', priority: 9 },
  { keywords: ['conclusion', 'summary', 'wrap up', 'ending', 'goodbye', 'thank you'], category: 'Lesson Conclusion', priority: 8 },
];

// Direct title to category mapping for common slide titles
const TITLE_CATEGORY_MAP: { [key: string]: string } = {
  'warm up': 'Introduction',
  'ice breaker': 'Introduction',
  'getting to know': 'Introduction',
  'objectives': 'Learning Objectives',
  'learning objectives': 'Learning Objectives',
  'goals': 'Learning Objectives',
  'new vocabulary': 'Vocabulary Development',
  'vocabulary': 'Vocabulary Development',
  'word bank': 'Vocabulary Development',
  'grammar focus': 'Grammar Focus',
  'grammar': 'Grammar Focus',
  'listening': 'Listening Activities',
  'reading': 'Reading Activities',
  'speaking': 'Speaking Activities',
  'writing': 'Writing Activities',
  'discussion': 'Discussion Activities',
  'group work': 'Collaborative Learning',
  'pair work': 'Collaborative Learning',
  'practice': 'Practice Activities',
  'exercise': 'Practice Activities',
  'activity': 'Practice Activities',
  'game': 'Interactive Games',
  'quiz': 'Interactive Games',
  'review': 'Review & Summary',
  'homework': 'Homework Assignment',
  'conclusion': 'Lesson Conclusion'
};

export const categorizeActivityFromRawSlide = (slideData: RawSlideContent): string => {
  console.log(`=== CATEGORIZING SLIDE ${slideData.slideNumber} ===`);
  console.log(`Title: "${slideData.title}"`);
  console.log(`Text elements: ${slideData.textElements.length}`);
  console.log(`Layout hints: [${slideData.layoutHints.join(', ')}]`);
  
  const cleanTitle = slideData.title.trim().toLowerCase();
  
  // Strategy 1: Direct title mapping
  for (const [titlePattern, category] of Object.entries(TITLE_CATEGORY_MAP)) {
    if (cleanTitle.includes(titlePattern)) {
      console.log(`✓ Direct title match: "${titlePattern}" → ${category}`);
      return category;
    }
  }
  
  // Strategy 2: Pattern matching in title
  if (cleanTitle) {
    const titleMatch = findBestPatternMatch(cleanTitle);
    if (titleMatch.category !== 'Content Slide') {
      console.log(`✓ Title pattern match: ${titleMatch.category} (score: ${titleMatch.score})`);
      return titleMatch.category;
    }
  }
  
  // Strategy 3: Content analysis
  const contentMatch = findBestPatternMatch(slideData.allText);
  if (contentMatch.category !== 'Content Slide') {
    console.log(`✓ Content pattern match: ${contentMatch.category} (score: ${contentMatch.score})`);
    return contentMatch.category;
  }
  
  // Strategy 4: Layout-based inference
  const layoutCategory = inferFromLayout(slideData);
  if (layoutCategory !== 'Content Slide') {
    console.log(`✓ Layout inference: ${layoutCategory}`);
    return layoutCategory;
  }
  
  // Strategy 5: Position-based inference (intro/conclusion)
  const positionCategory = inferFromPosition(slideData);
  if (positionCategory !== 'Content Slide') {
    console.log(`✓ Position inference: ${positionCategory}`);
    return positionCategory;
  }
  
  // Fallback: Use title as category if meaningful
  if (slideData.title && slideData.title.length > 2 && slideData.title.length < 50) {
    const titleCategory = slideData.title.charAt(0).toUpperCase() + slideData.title.slice(1);
    console.log(`→ Using title as category: "${titleCategory}"`);
    return titleCategory;
  }
  
  console.log(`→ Defaulting to: Content Slide`);
  return 'Content Slide';
};

const findBestPatternMatch = (text: string): { category: string; score: number } => {
  const lowerText = text.toLowerCase();
  let bestMatch = { category: 'Content Slide', score: 0 };
  
  for (const pattern of ACTIVITY_PATTERNS) {
    const matchCount = pattern.keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      const score = matchCount * pattern.priority;
      if (score > bestMatch.score) {
        bestMatch = { category: pattern.category, score };
      }
    }
  }
  
  return bestMatch;
};

const inferFromLayout = (slideData: RawSlideContent): string => {
  const { layoutHints, textElements, hasImages } = slideData;
  
  // Interactive content indicators
  if (layoutHints.includes('bullets') && textElements.length > 3) {
    return 'Practice Activities';
  }
  
  if (layoutHints.includes('table')) {
    return 'Matching Activities';
  }
  
  if (hasImages && textElements.length < 3) {
    return 'Content Presentation';
  }
  
  if (layoutHints.includes('text-heavy')) {
    return 'Reading Activities';
  }
  
  return 'Content Slide';
};

const inferFromPosition = (slideData: RawSlideContent): string => {
  const slideNumber = slideData.slideNumber;
  
  // First slide is often introduction
  if (slideNumber === 1) {
    return 'Introduction';
  }
  
  // Could add logic for last slide being conclusion
  // if (slideNumber === totalSlides) return 'Lesson Conclusion';
  
  return 'Content Slide';
};

// Legacy compatibility functions
export const categorizeActivityType = (slideTitle: string, allText: string): string => {
  // Create a minimal RawSlideContent for compatibility
  const mockSlideData: RawSlideContent = {
    slideNumber: 1,
    xmlContent: '',
    textElements: [{ text: slideTitle, hierarchy: 1, isTitle: true }],
    title: slideTitle,
    allText,
    hasImages: false,
    hasShapes: false,
    layoutHints: []
  };
  
  return categorizeActivityFromRawSlide(mockSlideData);
};

export const extractActivityTypeFromTitle = (slideTitle: string): string => {
  return categorizeActivityType(slideTitle, '');
};

export const extractActivityTypesFromSlide = (slideTitle: string, allText: string): string[] => {
  const activityType = categorizeActivityType(slideTitle, allText);
  return [activityType];
};
