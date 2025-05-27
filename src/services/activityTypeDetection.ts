
// Enhanced activity type detection with pedagogical categorization
interface ActivityPattern {
  keywords: string[];
  category: string;
  priority: number; // Higher priority = more specific match
}

// Pedagogical activity type patterns
const ACTIVITY_PATTERNS: ActivityPattern[] = [
  // Introduction & Objectives
  { keywords: ['objective', 'goal', 'aim', 'by the end', 'will be able'], category: 'Learning Objectives', priority: 10 },
  { keywords: ['welcome', 'introduction', 'warm up', 'ice breaker', 'getting started'], category: 'Introduction', priority: 10 },
  
  // Vocabulary & Language Focus
  { keywords: ['vocabulary', 'new words', 'key terms', 'lexis', 'word study'], category: 'Vocabulary Development', priority: 9 },
  { keywords: ['grammar', 'structure', 'language point', 'tense', 'syntax'], category: 'Grammar Focus', priority: 9 },
  { keywords: ['pronunciation', 'phonetics', 'sounds', 'intonation', 'stress'], category: 'Pronunciation Practice', priority: 9 },
  
  // Interactive Activities
  { keywords: ['matching', 'match', 'pair up', 'connect'], category: 'Matching Activities', priority: 8 },
  { keywords: ['fill in', 'complete', 'gap fill', 'blank', 'missing'], category: 'Gap Fill Activities', priority: 8 },
  { keywords: ['role play', 'roleplay', 'act out', 'scenario', 'dialogue'], category: 'Role Play', priority: 8 },
  { keywords: ['discussion', 'talk about', 'share', 'debate', 'opinion'], category: 'Discussion Activities', priority: 8 },
  { keywords: ['listening', 'audio', 'hear', 'sound'], category: 'Listening Activities', priority: 8 },
  { keywords: ['reading', 'text', 'passage', 'article'], category: 'Reading Activities', priority: 8 },
  { keywords: ['writing', 'write', 'compose', 'essay'], category: 'Writing Activities', priority: 8 },
  { keywords: ['speaking', 'present', 'tell', 'explain'], category: 'Speaking Activities', priority: 8 },
  
  // Practice & Exercises
  { keywords: ['practice', 'exercise', 'drill', 'try this', 'activity'], category: 'Practice Activities', priority: 7 },
  { keywords: ['game', 'quiz', 'competition', 'challenge'], category: 'Interactive Games', priority: 7 },
  { keywords: ['group work', 'teamwork', 'collaborate', 'together'], category: 'Collaborative Learning', priority: 7 },
  
  // Assessment & Review
  { keywords: ['test', 'quiz', 'assessment', 'check', 'evaluate'], category: 'Assessment', priority: 8 },
  { keywords: ['review', 'summary', 'recap', 'what we learned', 'consolidation'], category: 'Review & Summary', priority: 8 },
  { keywords: ['feedback', 'correction', 'error', 'mistake'], category: 'Feedback & Correction', priority: 7 },
  
  // Content Presentation
  { keywords: ['presentation', 'explanation', 'demonstration', 'show'], category: 'Content Presentation', priority: 6 },
  { keywords: ['example', 'sample', 'model', 'illustration'], category: 'Examples & Models', priority: 6 },
  
  // Homework & Conclusion
  { keywords: ['homework', 'assignment', 'next time', 'for next class', 'take home'], category: 'Homework Assignment', priority: 9 },
  { keywords: ['conclusion', 'summary', 'wrap up', 'ending', 'goodbye'], category: 'Lesson Conclusion', priority: 8 },
];

// Common slide title patterns that should be categorized
const TITLE_PATTERNS: { [key: string]: string } = {
  'warm up': 'Introduction',
  'ice breaker': 'Introduction',
  'getting to know': 'Introduction',
  'let\'s start': 'Introduction',
  'objectives': 'Learning Objectives',
  'goals': 'Learning Objectives',
  'what you will learn': 'Learning Objectives',
  'new vocabulary': 'Vocabulary Development',
  'word bank': 'Vocabulary Development',
  'key words': 'Vocabulary Development',
  'grammar focus': 'Grammar Focus',
  'language point': 'Grammar Focus',
  'structure': 'Grammar Focus',
  'listen and': 'Listening Activities',
  'listening task': 'Listening Activities',
  'read and': 'Reading Activities',
  'reading comprehension': 'Reading Activities',
  'speaking practice': 'Speaking Activities',
  'talk about': 'Speaking Activities',
  'writing task': 'Writing Activities',
  'write about': 'Writing Activities',
  'discussion': 'Discussion Activities',
  'group discussion': 'Discussion Activities',
  'pair work': 'Collaborative Learning',
  'group work': 'Collaborative Learning',
  'activity': 'Practice Activities',
  'exercise': 'Practice Activities',
  'practice': 'Practice Activities',
  'game': 'Interactive Games',
  'quiz': 'Interactive Games',
  'review': 'Review & Summary',
  'summary': 'Review & Summary',
  'homework': 'Homework Assignment',
  'assignment': 'Homework Assignment',
  'conclusion': 'Lesson Conclusion',
  'wrap up': 'Lesson Conclusion'
};

export const categorizeActivityType = (slideTitle: string, allText: string): string => {
  console.log(`Categorizing activity type for title: "${slideTitle}"`);
  
  // Clean and normalize the title
  const cleanTitle = slideTitle.trim().toLowerCase();
  
  if (!cleanTitle) {
    console.log('No title found, analyzing content...');
    return categorizeFromContent(allText);
  }
  
  // First, check for direct title pattern matches
  for (const [pattern, category] of Object.entries(TITLE_PATTERNS)) {
    if (cleanTitle.includes(pattern)) {
      console.log(`Found direct title pattern match: "${pattern}" → ${category}`);
      return category;
    }
  }
  
  // Then check for keyword patterns in the title
  let bestMatch = { category: '', priority: 0, matchCount: 0 };
  
  for (const pattern of ACTIVITY_PATTERNS) {
    const matchCount = pattern.keywords.filter(keyword => 
      cleanTitle.includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      const score = matchCount * pattern.priority;
      if (score > bestMatch.priority * bestMatch.matchCount) {
        bestMatch = { category: pattern.category, priority: pattern.priority, matchCount };
      }
    }
  }
  
  if (bestMatch.category) {
    console.log(`Found keyword pattern match in title: ${bestMatch.category} (score: ${bestMatch.priority * bestMatch.matchCount})`);
    return bestMatch.category;
  }
  
  // If no title patterns match, analyze the content
  console.log('No title patterns matched, analyzing slide content...');
  return categorizeFromContent(allText, cleanTitle);
};

const categorizeFromContent = (allText: string, slideTitle?: string): string => {
  const lowerText = allText.toLowerCase();
  
  // Analyze content for activity patterns
  let bestMatch = { category: 'Content Slide', priority: 0, matchCount: 0 };
  
  for (const pattern of ACTIVITY_PATTERNS) {
    const matchCount = pattern.keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    ).length;
    
    if (matchCount > 0) {
      const score = matchCount * pattern.priority;
      if (score > bestMatch.priority * bestMatch.matchCount) {
        bestMatch = { category: pattern.category, priority: pattern.priority, matchCount };
      }
    }
  }
  
  if (bestMatch.category !== 'Content Slide') {
    console.log(`Found content pattern match: ${bestMatch.category} (score: ${bestMatch.priority * bestMatch.matchCount})`);
    return bestMatch.category;
  }
  
  // Final fallback: if we have a meaningful title but no patterns matched
  if (slideTitle && slideTitle.length > 0) {
    console.log(`Using slide title as activity type: "${slideTitle}"`);
    // Capitalize first letter for consistency
    return slideTitle.charAt(0).toUpperCase() + slideTitle.slice(1);
  }
  
  console.log('Defaulting to Content Slide');
  return 'Content Slide';
};

// Legacy function for backward compatibility
export const extractActivityTypeFromTitle = (slideTitle: string): string => {
  return categorizeActivityType(slideTitle, '');
};

// Legacy function for backward compatibility  
export const extractActivityTypesFromSlide = (slideTitle: string, allText: string): string[] => {
  const activityType = categorizeActivityType(slideTitle, allText);
  return [activityType];
};
