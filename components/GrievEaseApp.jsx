"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, Camera, AlertCircle, Clock, Building2, Sparkles, CheckCircle2, FileText, Brain, Image as ImageIcon, MessageSquare, Edit2, Check, X, Moon, Sun, User, Mail, MapPin, Zap } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

const compressAndEncodeImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.onload = (event) => {
      const img = new window.Image();
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        let width = img.width;
        let height = img.height;
        const maxSize = 600;
        
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        resolve(base64);
      };
      
      img.src = event.target.result;
    };
    
    reader.readAsDataURL(file);
  });
};

const CATEGORY_ROUTE_MAP = {
  'fire emergency': { dept: 'Fire Department', priority: 'Critical', time: '1-2 hours' },
  'garbage issue': { dept: 'Sanitation Department', priority: 'Medium', time: '24-48 hours' },
  'sanitation': { dept: 'Sanitation Department', priority: 'Medium', time: '24-48 hours' },
  'street cleaning': { dept: 'Sanitation Department', priority: 'Medium', time: '24-48 hours' },
  'garbage overflow': { dept: 'Sanitation Department', priority: 'High', time: '12-24 hours' },
  'street littering': { dept: 'Sanitation Department', priority: 'Medium', time: '24-48 hours' },
  'waste dumping': { dept: 'Sanitation Department', priority: 'High', time: '24-48 hours' },
  'illegal dumping': { dept: 'Sanitation Department', priority: 'High', time: '24-48 hours' },
  'water leakage': { dept: 'Water & Sewerage Board', priority: 'High', time: '12-24 hours' },
  'water supply': { dept: 'Water & Sewerage Board', priority: 'High', time: '12-24 hours' },
  'pipe burst': { dept: 'Water & Sewerage Board', priority: 'High', time: '8-12 hours' },
  'road damage': { dept: 'Public Works Department', priority: 'High', time: '3-5 days' },
  'pothole': { dept: 'Public Works Department', priority: 'High', time: '3-5 days' },
  'damaged road': { dept: 'Public Works Department', priority: 'High', time: '3-5 days' },
  'cracked road': { dept: 'Public Works Department', priority: 'Medium', time: '5-7 days' },
  'road erosion': { dept: 'Public Works Department', priority: 'High', time: '2-4 days' },
  'street light issue': { dept: 'Electrical Department', priority: 'Medium', time: '48-72 hours' },
  'streetlight not working': { dept: 'Electrical Department', priority: 'Medium', time: '48-72 hours' },
  'flickering streetlight': { dept: 'Electrical Department', priority: 'Low', time: '48-72 hours' },
  'electricity outage': { dept: 'Electrical Department', priority: 'High', time: '4-8 hours' },
  'exposed electric wires': { dept: 'Electrical Department', priority: 'Critical', time: '2-4 hours' },
  'drainage problem': { dept: 'Storm Water Drainage', priority: 'High', time: '24-48 hours' },
  'drainage blockage': { dept: 'Storm Water Drainage', priority: 'High', time: '12-24 hours' },
  'waterlogging': { dept: 'Storm Water Drainage', priority: 'High', time: '12-24 hours' },
  'open manhole': { dept: 'Storm Water Drainage', priority: 'Critical', time: '4-8 hours' },
  'flooded road': { dept: 'Storm Water Drainage', priority: 'High', time: '12-24 hours' },
  'noise complaint': { dept: 'Police Department', priority: 'Medium', time: '2-4 hours' },
  'law & order issue': { dept: 'Police Department', priority: 'High', time: '2-4 hours' },
  'misbehavior': { dept: 'Police Department', priority: 'Medium', time: '2-4 hours' },
  'public nuisance area': { dept: 'Police Department', priority: 'Medium', time: '4-8 hours' },
  'park maintenance': { dept: 'Parks & Recreation', priority: 'Low', time: '3-5 days' },
  'damaged public bench': { dept: 'Parks & Recreation', priority: 'Low', time: '3-5 days' },
  'building violation': { dept: 'Building Inspector', priority: 'Low', time: '5-7 days' },
  'illegal construction': { dept: 'Building Inspector', priority: 'High', time: '2-4 days' },
  'unsafe abandoned building': { dept: 'Building Inspector', priority: 'High', time: '1-2 days' },
  'cracked building wall': { dept: 'Building Inspector', priority: 'High', time: '1-2 days' },
  'footpath encroachment': { dept: 'Urban Development Department', priority: 'Medium', time: '2-4 days' },
  'unstable hoarding': { dept: 'Urban Development Department', priority: 'High', time: '12-24 hours' },
  'public health': { dept: 'Public Health Department', priority: 'Medium', time: '1-2 days' },
  'dirty public toilet': { dept: 'Public Health Department', priority: 'Medium', time: '1-2 days' },
  'clogged toilet': { dept: 'Public Health Department', priority: 'Medium', time: '1-2 days' },
  'overflowing urinal': { dept: 'Public Health Department', priority: 'Medium', time: '1-2 days' },
  'hospital service issue': { dept: 'Health Services Department', priority: 'High', time: '1-2 days' },
  'pharmacy issue': { dept: 'Health Services Department', priority: 'Medium', time: '1-2 days' },
  'medical negligence': { dept: 'Health Services Department', priority: 'High', time: '1-2 days' },
  'pollution': { dept: 'Environmental Department', priority: 'Medium', time: '2-3 days' },
  'environmental hazard': { dept: 'Environmental Department', priority: 'High', time: '1-2 days' },
  'visible smoke air pollution': { dept: 'Environmental Department', priority: 'High', time: '12-24 hours' },
  'burning garbage': { dept: 'Environmental Department', priority: 'High', time: '12-24 hours' },
  'chemical waste dumping': { dept: 'Environmental Department', priority: 'Critical', time: '4-8 hours' },
  'traffic signal not working': { dept: 'Traffic Department', priority: 'High', time: '8-12 hours' },
  'damaged traffic signal': { dept: 'Traffic Department', priority: 'High', time: '8-12 hours' },
  'illegal parking': { dept: 'Traffic Department', priority: 'Medium', time: '4-8 hours' },
  'double parking': { dept: 'Traffic Department', priority: 'Medium', time: '4-8 hours' },
  'public transport': { dept: 'Transport Department', priority: 'Medium', time: '1-2 days' },
  'train/bus delay': { dept: 'Transport Department', priority: 'Medium', time: '1-2 days' },
  'ticketing failure': { dept: 'Transport Department', priority: 'Low', time: '1-2 days' },
  'taxi/ride failure': { dept: 'Transport Department', priority: 'Low', time: '1-2 days' },
  'broken bus stop': { dept: 'Transport Department', priority: 'Medium', time: '2-4 days' },
  'broken metro station': { dept: 'Transport Department', priority: 'High', time: '2-4 days' },
  'stray dog menace': { dept: 'Animal Welfare Department', priority: 'High', time: '8-12 hours' },
  'injured stray animal': { dept: 'Animal Welfare Department', priority: 'High', time: '4-8 hours' },
  'animal carcass': { dept: 'Animal Welfare Department', priority: 'High', time: '4-8 hours' },
  'snake in public area': { dept: 'Animal Welfare Department', priority: 'Critical', time: '1-2 hours' },
};

const EMOTION_SENTIMENT_MAP = {
  angry: 'Negative - Urgent Attention',
  annoyed: 'Negative - Needs Attention',
  concerned: 'Negative - Needs Attention',
  confused: 'Neutral - Needs Clarification',
  disappointed: 'Negative - Needs Attention',
  frustrated: 'Negative - Urgent Attention',
  sad: 'Negative - Needs Attention',
  shocked: 'Negative - Urgent Attention',
  urgent: 'Negative - Urgent Attention',
  calm: 'Positive - Constructive',
  neutral: 'Neutral - Reporting Issue',
};

const PRIORITY_RANK = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

const PRIORITY_ORDER = ['Low', 'Medium', 'High', 'Critical'];
const MAX_HISTORY = 10;
const LAST_SUBMITTED_COMPLAINT_ID_KEY = 'lastSubmittedComplaintId';
const PRIORITY_TO_URGENCY = {
  Low: 'low',
  Medium: 'medium',
  High: 'high',
  Critical: 'high',
};

function normalizeCategory(value) {
  return String(value || '').trim().toLowerCase();
}

function formatCategoryLabel(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word) => {
      if (!word) return word;
      if (word.toUpperCase() === 'ATM') return 'ATM';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function deriveSentiment(emotion) {
  return EMOTION_SENTIMENT_MAP[String(emotion || '').trim().toLowerCase()] || 'Neutral - Reporting Issue';
}

function isValidEmail(value) {
  const email = String(value || '').trim();
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);
}

function normalizeUrgencyLabel(value, fallbackScore = null) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }

  if (typeof fallbackScore === 'number') {
    if (fallbackScore >= 0.7) return 'high';
    if (fallbackScore <= 0.4) return 'low';
  }

  return 'medium';
}

function shiftPriority(priority, delta) {
  const currentIndex = PRIORITY_ORDER.indexOf(priority);
  const safeIndex = currentIndex === -1 ? 1 : currentIndex;
  const nextIndex = Math.min(PRIORITY_ORDER.length - 1, Math.max(0, safeIndex + delta));
  return PRIORITY_ORDER[nextIndex];
}

function derivePriority(basePriority, urgencyLabel) {
  if (basePriority === 'Critical') return 'Critical';

  const normalizedUrgency = normalizeUrgencyLabel(urgencyLabel);
  if (normalizedUrgency === 'high') {
    return shiftPriority(basePriority, 1);
  }

  if (normalizedUrgency === 'low') {
    return shiftPriority(basePriority, -1);
  }

  return basePriority;
}

function parseDurationToAverageHours(value) {
  const input = String(value || '').trim().toLowerCase();
  if (!input) return null;

  const rangeMatch = input.match(/(\d+)\s*-\s*(\d+)\s*(hours?|days?)/i);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    const unit = rangeMatch[3].toLowerCase();
    const multiplier = unit.startsWith('day') ? 24 : 1;
    return ((start + end) / 2) * multiplier;
  }

  const daysMatch = input.match(/(\d+)\s*days?/i);
  const hoursMatch = input.match(/(\d+)\s*hours?/i);

  if (daysMatch || hoursMatch) {
    const days = daysMatch ? Number(daysMatch[1]) : 0;
    const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
    return (days * 24) + hours;
  }

  return null;
}

function formatHoursToReadable(totalHours) {
  const safeHours = Math.max(2, Math.round(totalHours || 0));
  if (safeHours < 24) {
    return `${safeHours} hours`;
  }

  const days = Math.floor(safeHours / 24);
  const hours = safeHours % 24;

  if (hours === 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  return `${days} day${days > 1 ? 's' : ''} ${hours} hours`;
}

function deriveEstimatedTime(baseTime, modelTime, urgencyLabel) {
  const baseHours = parseDurationToAverageHours(baseTime) ?? 36;
  const modelHours = parseDurationToAverageHours(modelTime);
  const normalizedUrgency = normalizeUrgencyLabel(urgencyLabel);

  let calibratedHours = modelHours !== null
    ? (baseHours * 0.7) + (modelHours * 0.3)
    : baseHours;

  if (normalizedUrgency === 'high') {
    calibratedHours *= 0.8;
  } else if (normalizedUrgency === 'low') {
    calibratedHours *= 1.2;
  }

  return formatHoursToReadable(calibratedHours);
}

function clampScore(value, fallback = 0.6) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(1, Math.max(0, numeric));
}

function deriveUrgencyAssessment({ text, category, basePriority, modelLabel, modelConfidence }) {
  const normalizedText = String(text || '').trim().toLowerCase();
  const normalizedCategory = normalizeCategory(category);
  const normalizedModelLabel = normalizeUrgencyLabel(modelLabel);
  const baselineLabel = PRIORITY_TO_URGENCY[basePriority] || 'medium';
  const confidence = clampScore(modelConfidence, 0.6);

  const strongHighUrgencyPatterns = [
    /\bimmediately\b/i,
    /\burgent\b/i,
    /\bemergency\b/i,
    /\baccident\b/i,
    /\bcan die\b/i,
    /\bmay fall\b/i,
    /\bunsafe\b/i,
    /\bcritical\b/i,
  ];

  const cautionUrgencyPatterns = [
    /\bdanger(?:ous)?\b/i,
    /\brisk\b/i,
  ];

  const lowUrgencyPatterns = [
    /\broutine maintenance\b/i,
    /\bnot dangerous\b/i,
    /\bslightly damaged\b/i,
    /\bnot urgent\b/i,
    /\bwhenever possible\b/i,
    /\bcan be repaired later\b/i,
    /\bduring routine maintenance\b/i,
  ];

  const hasLowUrgencyLanguage = lowUrgencyPatterns.some((pattern) => pattern.test(normalizedText));
  const hasStrongHighUrgencyLanguage = strongHighUrgencyPatterns.some((pattern) => pattern.test(normalizedText));
  const hasCautionUrgencyLanguage = cautionUrgencyPatterns.some((pattern) => pattern.test(normalizedText));
  const hasHighUrgencyLanguage = hasStrongHighUrgencyLanguage || (hasCautionUrgencyLanguage && !hasLowUrgencyLanguage);

  if (hasLowUrgencyLanguage && !hasStrongHighUrgencyLanguage) {
    return {
      label: 'low',
      score: 0.35,
    };
  }

  if (hasHighUrgencyLanguage) {
    return {
      label: 'high',
      score: Math.max(0.85, confidence),
    };
  }

  let label;
  if (confidence < 0.75) {
    label = baselineLabel;
  } else {
    label = normalizedModelLabel;
  }

  if (baselineLabel === 'low' && label === 'high' && confidence < 0.9) {
    label = hasHighUrgencyLanguage ? 'high' : 'low';
  }

  if (baselineLabel === 'medium' && label === 'high' && confidence < 0.85 && !hasHighUrgencyLanguage) {
    label = 'medium';
  }

  if (normalizedCategory === 'fire emergency') {
    label = 'high';
  }

  const labelBaseScore = {
    low: 0.3,
    medium: 0.6,
    high: 0.85,
  };

  const baseScore = labelBaseScore[label] ?? 0.6;
  const score = normalizedModelLabel === label
    ? (baseScore * 0.45) + (confidence * 0.55)
    : (baseScore * 0.8) + (confidence * 0.2);

  return {
    label,
    score: clampScore(score, baseScore),
  };
}

const KEYWORD_CATEGORY_OVERRIDES = [
  {
    category: 'fire emergency',
    confidence: 0.98,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\bfire department\b/i,
      /\bthere is fire\b/i,
      /\bcaught fire\b/i,
      /\bon fire\b/i,
      /\bfire near\b/i,
      /\bfire in\b/i,
      /\bbuilding fire\b/i,
      /\bhouse fire\b/i,
      /\bshop fire\b/i,
      /\bblaze\b/i,
      /\bflames?\b/i,
      /\bgas leak\b/i,
      /\bcylinder leak\b/i,
    ],
  },
  {
    category: 'exposed electric wires',
    confidence: 0.96,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\bexposed (electric )?wires?\b/i,
      /\blive wires?\b/i,
      /\bsparking wires?\b/i,
      /\belectric sparks?\b/i,
      /\bshort circuit\b/i,
      /\belectric pole spark\b/i,
    ],
  },
  {
    category: 'open manhole',
    confidence: 0.97,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\bopen manhole\b/i,
      /\bmanhole (is )?open\b/i,
      /\bmissing manhole cover\b/i,
      /\bsewer (is )?open\b/i,
    ],
  },
  {
    category: 'drainage blockage',
    confidence: 0.95,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\bdrain(age)? (is )?(blocked|choked|clogged)\b/i,
      /\bblocked sewer\b/i,
      /\bchoked drain\b/i,
      /\bdrain overflow\b/i,
    ],
  },
  {
    category: 'waterlogging',
    confidence: 0.95,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\bwaterlogging\b/i,
      /\bflooded road\b/i,
      /\broad is flooded\b/i,
      /\bsevere flooding\b/i,
      /\bwater filled on road\b/i,
    ],
  },
  {
    category: 'traffic signal not working',
    confidence: 0.95,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\btraffic signal (is )?not working\b/i,
      /\btraffic light (is )?not working\b/i,
      /\btraffic signal failure\b/i,
      /\bsignal light not working\b/i,
    ],
  },
  {
    category: 'stray dog menace',
    confidence: 0.94,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\bstray dogs?\b/i,
      /\bdogs? chasing\b/i,
      /\bdog bite risk\b/i,
      /\bdog menace\b/i,
    ],
  },
  {
    category: 'injured stray animal',
    confidence: 0.95,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\binjured (stray )?(dog|animal|cow|cat|puppy)\b/i,
      /\bhurt (stray )?(dog|animal|cow|cat)\b/i,
      /\banimal accident\b/i,
    ],
  },
  {
    category: 'snake in public area',
    confidence: 0.96,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\bsnake spotted\b/i,
      /\bsnake in (public|school|park|road|office|house|colony|street)\b/i,
      /\bvenomous snake\b/i,
    ],
  },
  {
    category: 'burning garbage',
    confidence: 0.95,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\bburning garbage\b/i,
      /\bgarbage is burning\b/i,
      /\bwaste is burning\b/i,
      /\btrash fire\b/i,
    ],
  },
  {
    category: 'chemical waste dumping',
    confidence: 0.97,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\bchemical waste\b/i,
      /\btoxic waste\b/i,
      /\bhazardous waste\b/i,
      /\bchemical dumping\b/i,
    ],
  },
  {
    category: 'illegal construction',
    confidence: 0.94,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\billegal construction\b/i,
      /\bunauthorized construction\b/i,
      /\bconstruction without permission\b/i,
    ],
  },
  {
    category: 'unsafe abandoned building',
    confidence: 0.95,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\babandoned building\b/i,
      /\bunsafe building\b/i,
      /\bdangerous building\b/i,
      /\bbuilding wall is cracked\b/i,
      /\bcracked building wall\b/i,
    ],
  },
  {
    category: 'law & order issue',
    confidence: 0.94,
    source: 'GrievEase Hybrid AI Routing',
    patterns: [
      /\btheft\b/i,
      /\bstealing\b/i,
      /\bfight\b/i,
      /\bassault\b/i,
      /\bharassment\b/i,
      /\bviolence\b/i,
      /\bmolestation\b/i,
    ],
  },
];

function detectCategoryOverride(text, currentCategory) {
  const normalizedText = String(text || '').trim().toLowerCase();

  if (!normalizedText) {
    return null;
  }

  for (const rule of KEYWORD_CATEGORY_OVERRIDES) {
    const matchesRule = rule.patterns.some((pattern) => pattern.test(normalizedText));
    if (matchesRule) {
      return {
        category: rule.category,
        confidence: rule.confidence,
        analysisSource: rule.source,
      };
    }
  }

  return null;
}

function getStoredLastComplaintId() {
  if (typeof window === 'undefined') return '';

  try {
    return localStorage.getItem(LAST_SUBMITTED_COMPLAINT_ID_KEY) || '';
  } catch {
    return '';
  }
}

function rememberSubmittedComplaint(complaintId, complaintData) {
  if (!complaintId || typeof window === 'undefined') return;

  try {
    const stored = JSON.parse(localStorage.getItem('complaintHistory') || '[]');
    const entry = {
      id: String(complaintId),
      category: complaintData.category,
      priority: complaintData.priority,
      department: complaintData.department,
      timestamp: new Date().toISOString(),
    };
    const filtered = stored.filter((item) => item.id !== entry.id);
    const updated = [entry, ...filtered].slice(0, MAX_HISTORY);

    localStorage.setItem('complaintHistory', JSON.stringify(updated));
    localStorage.setItem(LAST_SUBMITTED_COMPLAINT_ID_KEY, String(complaintId));
  } catch {
    // Tracking history is a convenience feature; submission should not fail if storage is blocked.
  }
}

function categorizeComplaint(category) {
  const normalized = normalizeCategory(category);

  if (CATEGORY_ROUTE_MAP[normalized]) {
    return CATEGORY_ROUTE_MAP[normalized];
  }

  const keywordRules = [
    { match: ['road', 'pothole', 'bench', 'signboard', 'metro', 'infrastructure'], dept: 'Public Works Department', priority: 'Medium', time: '3-5 days' },
    { match: ['water', 'pipe', 'supply'], dept: 'Water & Sewerage Board', priority: 'High', time: '12-24 hours' },
    { match: ['drain', 'manhole', 'waterlogging'], dept: 'Storm Water Drainage', priority: 'High', time: '12-24 hours' },
    { match: ['streetlight', 'electric', 'outage'], dept: 'Electrical Department', priority: 'High', time: '24-48 hours' },
    { match: ['garbage', 'sanitation', 'litter', 'waste'], dept: 'Sanitation Department', priority: 'Medium', time: '24-48 hours' },
    { match: ['health', 'hospital', 'medical', 'pharmacy', 'toilet', 'urinal'], dept: 'Public Health Department', priority: 'Medium', time: '1-2 days' },
    { match: ['pollution', 'environment', 'smoke', 'chemical'], dept: 'Environmental Department', priority: 'High', time: '1-2 days' },
    { match: ['traffic', 'transport', 'parking', 'taxi', 'train', 'bus', 'ticket'], dept: 'Transport Department', priority: 'Medium', time: '1-2 days' },
    { match: ['noise', 'law', 'misbehavior', 'nuisance', 'safety', 'accident'], dept: 'Police Department', priority: 'Medium', time: '2-4 hours' },
    { match: ['building', 'construction', 'hoarding', 'encroachment', 'land records'], dept: 'Building Inspector', priority: 'Medium', time: '2-4 days' },
    { match: ['animal', 'stray', 'snake'], dept: 'Animal Welfare Department', priority: 'High', time: '4-8 hours' },
    { match: ['education'], dept: 'Education Department', priority: 'Medium', time: '2-4 days' },
    { match: ['tax'], dept: 'Tax Department', priority: 'Medium', time: '2-4 days' },
    { match: ['government', 'document', 'public welfare'], dept: 'Civic Administration', priority: 'Medium', time: '2-4 days' },
    { match: ['bank', 'atm', 'refund', 'billing', 'product', 'delivery', 'fraud'], dept: 'Consumer Affairs Department', priority: 'Medium', time: '2-4 days' },
  ];

  const matchedRule = keywordRules.find((rule) => rule.match.some((keyword) => normalized.includes(keyword)));
  return matchedRule || { dept: 'General Administration', priority: 'Medium', time: '2-3 days' };
}

const CATEGORIES = Object.keys(CATEGORY_ROUTE_MAP).sort((a, b) => a.localeCompare(b));

const GrievEaseApp = () => {
  const { toggleTheme } = useTheme();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [complaintText, setComplaintText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [processingStage, setProcessingStage] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [submittedComplaintId, setSubmittedComplaintId] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const trackComplaintHref = submittedComplaintId
    ? `/track?id=${encodeURIComponent(submittedComplaintId)}`
    : '/track';

  useEffect(() => {
    setSubmittedComplaintId(getStoredLastComplaintId());
  }, []);

  const hasValidUserDetails = userName.trim() && userLocation.trim() && isValidEmail(userEmail);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResults(null);
      setError(null);
      setSubmitSuccess(false);
    }
  };

  const processComplaint = async () => {
    if (!userName.trim()) {
      setError('Please enter your full name before running the AI analysis.');
      return;
    }

    if (!isValidEmail(userEmail)) {
      setError('Please enter a valid email address before running the AI analysis.');
      return;
    }

    if (!userLocation.trim()) {
      setError('Please enter the complaint location before running the AI analysis.');
      return;
    }

    if (!complaintText.trim()) {
      setError('Please enter complaint text before running the AI analysis.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProcessingStage('Initializing AI analysis...');
    setSubmitSuccess(false);
    
    try {
      setProcessingStage('Analyzing with GrievEase AI models...');

      // 2. Create a FormData object to send
      const formData = new FormData();
      formData.append('text', complaintText);

      // 3. Append the raw image file (not the base64 preview)
      if (imageFile) {
        formData.append('file', imageFile);
      }

      // 4. Make ONE call to our Next.js backend with the FormData
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData, 
        // NOTE: Do not set a 'Content-Type' header;
        // the browser does it automatically for FormData.
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "AI analysis failed");
      }

      const result = data.result;
      console.log("Local AI Result:", result);
      let finalCategory = result.text_category;
      
      if (result.text_category_confidence < 0.5 && result.image_category) {
        finalCategory = result.image_category;
      }

      const categoryOverride = detectCategoryOverride(complaintText, finalCategory);
      if (categoryOverride) {
        finalCategory = categoryOverride.category;
      }

      const normalizedCategory = normalizeCategory(finalCategory);
      const departmentInfo = categorizeComplaint(normalizedCategory);
      
      const { label: urgencyLabel, score: urgencyScore } = deriveUrgencyAssessment({
        text: complaintText,
        category: normalizedCategory,
        basePriority: departmentInfo.priority,
        modelLabel: result.urgency,
        modelConfidence: result.urgency_confidence,
      });
      const adjustedPriority = derivePriority(departmentInfo.priority, urgencyLabel);
      const adjustedEstimatedTime = deriveEstimatedTime(
        departmentInfo.time,
        result.predicted_resolution_readable,
        urgencyLabel
      );

      const sentiment = deriveSentiment(result.emotion);
      const readableCategory = formatCategoryLabel(finalCategory);
      const finalConfidence = categoryOverride
        ? Math.max(result.text_category_confidence ?? 0, categoryOverride.confidence)
        : result.text_category_confidence;
      const finalAnalysisSource = categoryOverride?.analysisSource ?? 'GrievEase ML API';

      setResults({
        category: readableCategory,
        confidence: finalConfidence,
        department: departmentInfo.dept,
        priority: adjustedPriority,
        estimatedTime: adjustedEstimatedTime,
        emotion: result.emotion,
        sentiment,
        urgency: urgencyScore,
        urgencyLabel,
        imageDescription: result.image_category ? `AI detected: ${result.image_category}` : null,
        analysisSource: finalAnalysisSource,
        rawSentiment: result.emotion,
        sentimentConfidence: result.emotion_confidence,
        modelEstimatedTime: result.predicted_resolution_readable,
        baseEstimatedTime: departmentInfo.time,
        textAnalysis: null,
      });
      
      setSelectedCategory(normalizedCategory);
      setProcessingStage("Analysis complete!");

    } catch (err) {
      setError("Error processing complaint: " + err.message);
      console.error(err);
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };
  const handleCategoryChange = (newCategory) => {
    const departmentInfo = categorizeComplaint(newCategory);
    
    setResults(prev => ({
      ...prev,
      category: formatCategoryLabel(newCategory),
      department: departmentInfo.dept,
      priority: derivePriority(departmentInfo.priority, prev?.urgencyLabel),
      estimatedTime: deriveEstimatedTime(
        departmentInfo.time,
        prev?.modelEstimatedTime,
        prev?.urgencyLabel
      ),
      baseEstimatedTime: departmentInfo.time,
    }));
    
    setSelectedCategory(newCategory);
    setIsEditingCategory(false);
  };

 const submitComplaint = async () => {
  if (!results) return;

  if (!userName.trim()) {
    setError('Please enter your full name before submitting the complaint.');
    return;
  }

  if (!isValidEmail(userEmail)) {
    setError('Please enter a valid email address before submitting the complaint.');
    return;
  }

  if (!userLocation.trim()) {
    setError('Please enter the complaint location before submitting the complaint.');
    return;
  }
  
  setIsSubmitting(true);
  setError(null);

  try {
    // Compress image if it exists
    let compressedImage = null;
    if (imageFile) {
      compressedImage = await compressAndEncodeImage(imageFile);
    }

    const complaintData = {
      userName: userName.trim(),
      userEmail: userEmail.trim().toLowerCase(),
      location: userLocation.trim(),
      category: results.category,
      description: complaintText,
      image: compressedImage, // ← Now it's compressed!
      department: results.department,
      priority: results.priority,
      estimatedTime: results.estimatedTime,
      emotion: results.emotion,
      sentiment: results.sentiment,
      urgency: results.urgency,
      confidence: results.confidence,
      analysisSource: results.analysisSource,
    };

    const response = await fetch('/api/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(complaintData),
    });

    const data = await response.json();

    if (data.success) {
      setSubmitSuccess(true);
      rememberSubmittedComplaint(data.complaintId, complaintData);
      setSubmittedComplaintId(data.complaintId);
      setShowThankYou(true);
    } else {
      throw new Error(data.error || 'Submission failed');
    }
  } catch (err) {
    setError('Failed to submit complaint. Please try again.');
    console.error('Submission error:', err);
  } finally {
    setIsSubmitting(false);
  }
};

  const resetForm = () => {
    setUserName('');
    setUserEmail('');
    setUserLocation('');
    setImageFile(null);
    setPreview(null);
    setComplaintText('');
    setResults(null);
    setError(null);
    setProcessingStage('');
    setSubmitSuccess(false);
    setIsEditingCategory(false);
    setSelectedCategory('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  GrievEase
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">AI-Powered Complaint Analysis System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Link
                href={trackComplaintHref}
                className="ml-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-800/60 transition-all duration-200 border border-indigo-200 dark:border-indigo-700"
              >
                Track Complaint
              </Link>
<button
  onClick={() => setShowAbout(true)}
  className="ml-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/60 transition-all duration-200 border border-blue-200 dark:border-blue-700"
>
  About
</button>
<button
  onClick={toggleTheme}
  aria-label="Toggle dark mode"
  className="ml-2 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600"
>
  <Moon className="w-4 h-4 dark:hidden" />
  <Sun className="w-4 h-4 hidden dark:block" />
</button>
            </div>
          </div>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  About GrievEase
                </h2>
              </div>
              <button onClick={() => setShowAbout(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              GrievEase is an AI-powered complaint analysis and management platform designed to automate the process of understanding, prioritizing, and routing public complaints.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Key Features</h3>
            <ul className="space-y-3 text-gray-600 dark:text-gray-300">
              <li className="flex items-start space-x-2">
                <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>AI Text Analysis</strong> — DistilBERT model classifies complaint category, emotion and urgency</span>
              </li>
              <li className="flex items-start space-x-2">
                <ImageIcon className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <span><strong>Image Recognition</strong> — CLIP model detects issues from uploaded photos</span>
              </li>
              <li className="flex items-start space-x-2">
                <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Resolution Time Prediction</strong> — Random Forest model estimates resolution time</span>
              </li>
              <li className="flex items-start space-x-2">
                <Building2 className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>Smart Routing</strong> — Automatically assigns complaints to the correct department</span>
              </li>
              <li className="flex items-start space-x-2">
                <Zap className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span><strong>IoT Integration</strong> — Supports real-time sensor inputs from smart city infrastructure</span>
              </li>
            </ul>
            <button
              onClick={() => setShowAbout(false)}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Thank You Page */}
      {showThankYou && (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-10 text-center animate-fadeIn">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 dark:bg-green-900/40 p-4 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Thank You!</h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-2">
              Thank you for reaching out to us.
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your complaint has been successfully recorded in our system and assigned to the <strong>{results?.department}</strong>. It will be resolved within <strong>{results?.estimatedTime}</strong>.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-4 text-left space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Category:</span> {results?.category}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Priority:</span> {results?.priority}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Department:</span> {results?.department}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Location:</span> {userLocation}</p>
            </div>
            {submittedComplaintId && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4 mb-6">
                <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mb-1">YOUR COMPLAINT ID</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 font-mono tracking-wider">{submittedComplaintId}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(submittedComplaintId);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="ml-2 bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-all"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <p className="text-xs text-indigo-400 dark:text-indigo-500 mt-1">Save this ID to track your complaint</p>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => { window.location.href = trackComplaintHref; }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Track My Complaint</span>
              </button>
              <button
                onClick={() => { setShowThankYou(false); resetForm(); }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                Submit Another Complaint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* User Details */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-blue-600" />
                Your Details (Required)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="userName"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="userEmail"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="userLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location / Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <textarea
                    id="userLocation"
                    value={userLocation}
                    onChange={(e) => setUserLocation(e.target.value)}
                    placeholder="e.g. Near Model Town railway crossing, Jalandhar"
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 resize-none"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Add a clear area, landmark, or address so the complaint can be assigned to the correct location after submission.
              </p>
            </div>

            {/* Image Upload */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-blue-600" />
                Upload Image (Optional)
              </h2>
              
              {!preview ? (
                <div
                  className={`border-3 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Camera className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Drag & drop your image here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Browse Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                    Supports: JPG, PNG, GIF (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden shadow-md">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-contain bg-gray-100 dark:bg-gray-700"
                    />
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => {
                          setImageFile(null);
                          setPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors shadow-lg"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-indigo-600" />
                Describe Your Complaint (Required)
              </h2>
              
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe the issue you're facing... (e.g., 'There is a large pothole on Main Street causing traffic issues' or 'Garbage bins haven't been collected for 3 days')"
                className="w-full h-48 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700"
              />
              
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{complaintText.length} characters</span>
                <span className="flex items-center">
                  <Brain className="w-4 h-4 mr-1" />
                  Text is required for AI analysis
                </span>
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={processComplaint}
              disabled={isProcessing || !hasValidUserDetails || !complaintText.trim()}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 ${
                isProcessing || !hasValidUserDetails || !complaintText.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Filing your complaint..</span>
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  <span>File Your Complaint</span>
                </>
              )}
            </button>

            {processingStage && isProcessing && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">{processingStage}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {submitSuccess && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-700 dark:text-green-400 font-medium">Complaint Submitted Successfully!</p>
                  <p className="text-green-600 dark:text-green-300 text-sm mt-1">Your complaint has been saved to the database.</p>
                </div>
              </div>
            )}

            {/* AI Features Info */}
            
          </div>

          {/* Results Section */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-indigo-600" />
                AI Analysis Results
              </h2>

              {!results && !isProcessing && (
                <div className="text-center py-16">
                  <ImageIcon className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">Add image or text to see AI analysis</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                    Add complaint text to begin analysis. An image is optional.
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">Processing with AI...</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Running multiple AI models for accurate analysis. Please wait a few seconds.</p>
                </div>
              )}

              {results && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Analysis Source */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Analysis Method: {results.analysisSource}</p>
                  </div>

                  {/* Category with Edit Option */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Detected Category</span>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                        {!isEditingCategory ? (
                          <button
                            onClick={() => setIsEditingCategory(true)}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded"
                            title="Edit category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsEditingCategory(false)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded"
                            title="Cancel edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {!isEditingCategory ? (
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{results.category}</p>
                    ) : (
                      <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full text-xl font-bold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 border-2 border-blue-300 dark:border-blue-500 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      >
                        {Array.from(new Set([selectedCategory, ...CATEGORIES].filter(Boolean))).map(cat => (
                          <option key={cat} value={cat}>{formatCategoryLabel(cat)}</option>
                        ))}
                      </select>
                    )}
                    
                    {results.imageDescription && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Image shows: {results.imageDescription}</p>
                    )}
                    
                    {isEditingCategory && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Category changed manually - department will update automatically
                      </p>
                    )}
                  </div>

                  {/* Analysis Status & Emotion */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl border border-green-100 dark:border-green-800">
                      <div className="flex items-center mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Analysis Status</span>
                      </div>
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">
                        Completed
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                      <div className="flex items-center mb-2">
                        <Brain className="w-4 h-4 text-purple-600 mr-2" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Emotion</span>
                      </div>
                      <p className="text-xl font-bold text-purple-700 dark:text-purple-400">{results.emotion}</p>
                      {results.rawSentiment && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          ({results.rawSentiment} - {(results.sentimentConfidence * 100).toFixed(0)}%)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Department */}
                  <div className="bg-amber-50 dark:bg-amber-900/30 p-5 rounded-xl border border-amber-100 dark:border-amber-800">
                    <div className="flex items-center mb-2">
                      <Building2 className="w-5 h-5 text-amber-600 mr-2" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Assigned Department</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{results.department}</p>
                  </div>

                  {/* Priority & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${
                      results.priority === 'High' ? 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800' :
                      results.priority === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-100 dark:border-yellow-800' :
                      'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800'
                    }`}>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Priority Level</span>
                      <p className={`text-lg font-bold mt-1 ${
                        results.priority === 'High' ? 'text-red-700 dark:text-red-400' :
                        results.priority === 'Medium' ? 'text-yellow-700 dark:text-yellow-400' :
                        'text-blue-700 dark:text-blue-400'
                      }`}>{results.priority}</p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                      <div className="flex items-center mb-1">
                        <Clock className="w-4 h-4 text-blue-600 mr-1" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Est. Time</span>
                      </div>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{results.estimatedTime}</p>
                    </div>
                  </div>

                  {/* Urgency Assessment */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Urgency Assessment</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Urgency Level:</span>
                        <span className={`text-sm font-semibold ${
                          results.urgency > 0.7
                            ? 'text-red-600 dark:text-red-400'
                            : results.urgency > 0.5
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                        }`}>
                          {results.urgencyLabel
                            ? results.urgencyLabel.charAt(0).toUpperCase() + results.urgencyLabel.slice(1)
                            : 'Medium'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Urgency Score:</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {(results.urgency * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-2">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            results.urgency > 0.7 ? 'bg-gradient-to-r from-orange-500 to-red-600' :
                            results.urgency > 0.5 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-green-500 to-yellow-500'
                          }`}
                          style={{ width: `${results.urgency * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {results.urgency > 0.7 ? '⚠️ High urgency - needs immediate attention' :
                         results.urgency > 0.5 ? '⏱️ Moderate urgency - timely response needed' :
                         '✓ Low urgency - routine maintenance'}
                      </p>
                    </div>
                  </div>

                  {/* Alternative Categories */}
                  {results.textAnalysis && results.textAnalysis.length > 1 && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Alternative Matches</h4>
                      <div className="space-y-2">
                        {results.textAnalysis.slice(1, 3).map((alt, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-300">{alt.category}</span>
                            <span className="font-medium text-indigo-700 dark:text-indigo-400">
                              {(alt.score * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={submitComplaint}
                      disabled={isSubmitting || submitSuccess}
                      className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 ${
                        isSubmitting || submitSuccess
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting to Database...</span>
                        </>
                      ) : submitSuccess ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Submitted Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Submit Complaint to Database</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetForm}
                      className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    >
                      Start New Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-gray-100">GrievEase</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">AI-Powered Complaint Analysis System</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <Link href="/track" className="hover:text-blue-600 transition-colors">Track Complaint</Link>
              <button onClick={() => setShowAbout(true)} className="hover:text-blue-600 transition-colors">About</button>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">© 2026 GrievEase. All rights reserved.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GrievEaseApp;
