"use client";
import React, { useState, useRef } from 'react';
import { Upload, Camera, AlertCircle, Clock, Building2, TrendingUp, Sparkles, CheckCircle2, FileText, Brain, Image, MessageSquare, Zap, Edit2, Check, X } from 'lucide-react';

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

const GrievEaseApp = () => {
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
  const fileInputRef = useRef(null);

  // Available complaint categories
  const CATEGORIES = [
    'Garbage Issue',
    'Water Leakage',
    'Road Damage',
    'Street Light Issue',
    'Drainage Problem',
    'Building Violation',
    'Noise Complaint',
    'Park Maintenance'
  ];

  // // Enhanced keyword patterns for better classification
  // const getEnhancedCategoryFromText = (text) => {
  //   const lowerText = text.toLowerCase();
    
  //   const advancedPatterns = {
  //     'Garbage Issue': {
  //       keywords: ['garbage', 'trash', 'waste', 'dump', 'litter', 'bin', 'dustbin', 'refuse', 
  //                  'rubbish', 'disposal', 'sanitation', 'smell', 'stink', 'rot', 'decompos',
  //                  'dumpster', 'landfill', 'overflowing', 'pile', 'heap', 'collect'],
  //       weight: 1.0
  //     },
  //     'Water Leakage': {
  //       keywords: ['water', 'leak', 'pipe', 'burst', 'tap', 'flood', 'drip', 'overflow',
  //                  'plumb', 'faucet', 'valve', 'gush', 'spray', 'wet', 'damp', 'moisture',
  //                  'seepage', 'main', 'hydrant', 'supply'],
  //       weight: 1.0
  //     },
  //     'Road Damage': {
  //       keywords: ['road', 'pothole', 'street', 'pavement', 'crack', 'asphalt', 'highway',
  //                  'lane', 'path', 'sidewalk', 'damage', 'broken', 'uneven', 'bump',
  //                  'surface', 'concrete', 'tar', 'gravel', 'repair', 'maintenance'],
  //       weight: 1.0
  //     },
  //     'Street Light Issue': {
  //       keywords: ['light', 'lamp', 'dark', 'street light', 'bulb', 'illuminate', 'lighting',
  //                  'pole', 'electric', 'night', 'visibility', 'glow', 'beam', 'fixture',
  //                  'lamppost', 'streetlamp', 'not working', 'broken light'],
  //       weight: 1.0
  //     },
  //     'Drainage Problem': {
  //       keywords: ['drain', 'sewer', 'clog', 'overflow', 'gutter', 'manhole', 'storm water',
  //                  'block', 'channel', 'culvert', 'waterlog', 'stagnant', 'puddle',
  //                  'sewage', 'wastewater', 'flood', 'back up'],
  //       weight: 1.0
  //     },
  //     'Building Violation': {
  //       keywords: ['building', 'construction', 'illegal', 'violation', 'unauthorized', 'permit',
  //                  'encroach', 'structure', 'demolish', 'unsafe', 'code', 'regulation',
  //                  'zoning', 'property', 'safety hazard'],
  //       weight: 1.0
  //     },
  //     'Noise Complaint': {
  //       keywords: ['noise', 'loud', 'sound', 'disturbance', 'music', 'volume', 'party',
  //                  'construction noise', 'horn', 'barking', 'shouting', 'speaker',
  //                  'amplifier', 'quiet', 'peace', 'annoy'],
  //       weight: 1.0
  //     },
  //     'Park Maintenance': {
  //       keywords: ['park', 'garden', 'tree', 'grass', 'playground', 'bench', 'fountain',
  //                  'lawn', 'landscape', 'plant', 'flower', 'maintenance', 'prune',
  //                  'mow', 'clean', 'equipment', 'swing', 'slide'],
  //       weight: 1.0
  //     },
  //   };

  //   let bestMatch = { category: 'General Complaint', score: 0, matchCount: 0 };

  //   for (const [category, data] of Object.entries(advancedPatterns)) {
  //     let matchCount = 0;
  //     let matchScore = 0;

  //     data.keywords.forEach(keyword => {
  //       if (lowerText.includes(keyword)) {
  //         matchCount++;
  //         matchScore += keyword.length / 10;
  //       }
  //     });

  //     if (matchCount > 0) {
  //       const finalScore = (matchCount / data.keywords.length) * data.weight + matchScore;
  //       if (finalScore > bestMatch.score) {
  //         bestMatch = { 
  //           category, 
  //           score: finalScore, 
  //           matchCount,
  //           confidence: Math.min(0.65 + (matchCount * 0.05), 0.95)
  //         };
  //       }
  //     }
  //   }

  //   return bestMatch;
  // };


  // Fallback emotion analysis
  // const analyzeEmotionFromCategory = (text) => {
  //   const lowerText = text.toLowerCase();
    
  //   const urgencyKeywords = {
  //     high: ['urgent', 'emergency', 'immediate', 'critical', 'danger', 'hazard', 'unsafe', 
  //            'severe', 'major', 'serious', 'risk', 'broken', 'burst', 'overflow', 'flood'],
  //     medium: ['problem', 'issue', 'concern', 'need', 'require', 'should', 'please'],
  //     low: ['minor', 'small', 'cosmetic', 'aesthetic', 'whenever', 'eventually']
  //   };

  //   let urgencyScore = 0.5;
  //   let emotion = 'Concerned';
  //   let sentiment = 'Neutral - Reporting Issue';

  //   if (urgencyKeywords.high.some(kw => lowerText.includes(kw))) {
  //     urgencyScore = 0.85;
  //     emotion = 'Urgent';
  //     sentiment = 'Negative - Immediate Action Required';
  //   } else if (urgencyKeywords.low.some(kw => lowerText.includes(kw))) {
  //     urgencyScore = 0.35;
  //     emotion = 'Patient';
  //     sentiment = 'Neutral - Routine Maintenance';
  //   } else if (['days', 'weeks', 'months', 'still', 'not fixed', 'again', 'repeatedly'].some(kw => lowerText.includes(kw))) {
  //     urgencyScore = 0.75;
  //     emotion = 'Frustrated';
  //     sentiment = 'Negative - Recurring Issue';
  //   }

  //   return { emotion, urgency: urgencyScore, sentiment };
  // };

  const categorizeComplaint = (category) => {
    
      const departmentMap = {
        // Your existing text categories
        'Garbage Issue': { dept: 'Sanitation Department', priority: 'Medium', time: '24-48 hours' },
        'Water Leakage': { dept: 'Water & Sewerage Board', priority: 'High', time: '12-24 hours' },
        'Road Damage': { dept: 'Public Works Department', priority: 'High', time: '3-5 days' },
        'Street Light Issue': { dept: 'Electrical Department', priority: 'Medium', time: '48-72 hours' },
        'Drainage Problem': { dept: 'Storm Water Drainage', priority: 'High', time: '24-48 hours' },
        'Building Violation': { dept: 'Building Inspector', priority: 'Low', time: '5-7 days' },
        'Noise Complaint': { dept: 'Police Department', priority: 'Medium', time: '2-4 hours' },
        'Park Maintenance': { dept: 'Parks & Recreation', priority: 'Low', time: '3-5 days' },
  
        // --- ADD YOUR NEW IMAGE CATEGORIES HERE ---
        'pothole': { dept: 'Public Works Department', priority: 'High', time: '3-5 days' },
        'damaged road': { dept: 'Public Works Department', priority: 'High', time: '3-5 days' },
        'cracked road': { dept: 'Public Works Department', priority: 'Medium', time: '5-7 days' },
        'road erosion': { dept: 'Public Works Department', priority: 'High', time: '2-4 days' },
        'garbage overflow': { dept: 'Sanitation Department', priority: 'High', time: '24-48 hours' },
        'illegal dumping': { dept: 'Sanitation Department', priority: 'Medium', time: '2-3 days' },
        'open manhole': { dept: 'Storm Water Drainage', priority: 'Critical', time: '4-8 hours' },
        'streetlight not working': { dept: 'Electrical Department', priority: 'Medium', time: '48-72 hours' },
        'flooded road': { dept: 'Storm Water Drainage', priority: 'High', time: '12-24 hours' },
        'dirty public toilet': { dept: 'Public Health Dept.', priority: 'Medium', time: '1-2 days' },
        'damaged traffic signal': { dept: 'Traffic Department', priority: 'High', time: '8-12 hours' },
        'snake in public area': { dept: 'Wildlife & Rescue', priority: 'Critical', time: '1-2 hours' },
      };
    
    
    return departmentMap[category] || { dept: 'General Administration', priority: 'Medium', time: '2-3 days' };
  };

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

  // const processComplaint = async () => {
  //   // This check is now more important
  //   if (!complaintText.trim()) {
  //     setError('Please enter complaint text. The AI model requires it.');
  //     return;
  //   }
    
  //   setIsProcessing(true);
  //   setError(null);
  //   setProcessingStage("Initializing AI analysis...");
  //   setSubmitSuccess(false);
    
  //   try {
  //     setProcessingStage("Analyzing with local AI models...");

  //     // 1. Create FormData
  //     const formData = new FormData();
  //     formData.append('text', complaintText);

  //     // 2. Append the file if it exists
  //     // We send the 'imageFile' (the raw file), not the 'preview' string
  //     if (imageFile) {
  //       formData.append('file', imageFile);
  //     }

  //     // 3. Make ONE call to our Next.js backend
  //     const response = await fetch('/api/analyze', {
  //       method: 'POST',
  //       body: formData, // Send the FormData object
  //       // Do NOT add a 'Content-Type' header here
  //     });

  //     const data = await response.json();

  //     if (!data.success) {
  //       throw new Error(data.error || "AI analysis failed");
  //     }

  //     // 4. Get the unified result
  //     const result = data.result;
  //     console.log("Local AI Result:", result);
      
  //     // 5. Map the Python model's result to your React state
  //     const departmentInfo = categorizeComplaint(result.text_category);
      
  //     const urgencyMap = {
  //       "low": 0.3,
  //       "medium": 0.6,
  //       "high": 0.9,
  //     };
  //     const urgencyScore = urgencyMap[result.urgency.toLowerCase()] || 0.6;
      
  //     let adjustedPriority = departmentInfo.priority;
  //     if (urgencyScore > 0.7) {
  //       adjustedPriority = 'High';
  //     } else if (urgencyScore < 0.4) {
  //       adjustedPriority = 'Low';
  //     }

  //     const sentimentMap = {
  //       "anger": "Negative - Urgent Attention",
  //       "fear": "Negative - Issue",
  //       "sadness": "Negative - Issue",
  //       "disgust": "Negative - Issue",
  //       "joy": "Positive - Constructive",
  //       "optimism": "Positive - Constructive",
  //       "love": "Positive - Constructive",
  //       "neutral": "Neutral - Reporting Issue"
  //     };
  //     const sentiment = sentimentMap[result.emotion.toLowerCase()] || 'Neutral - Reporting Issue';

  //     // 6. Set the final state object
  //     setResults({
  //       category: result.text_category,
  //       confidence: result.text_category_confidence,
  //       department: departmentInfo.dept,
  //       priority: adjustedPriority,
  //       // Use the new 'readable' time from the Python model
  //       estimatedTime: result.predicted_resolution_readable, 
  //       emotion: result.emotion,
  //       sentiment: sentiment,
  //       urgency: urgencyScore,
  //       imageDescription: result.image_category ? `AI detected: ${result.image_category}` : null,
  //       analysisSource: 'Local Python AI Model',
  //       rawSentiment: result.emotion,
  //       sentimentConfidence: result.emotion_confidence,
  //       textAnalysis: null,
  //     });
      
  //     setSelectedCategory(result.text_category);
  //     setProcessingStage("Analysis complete!");

  //   } catch (err) {
  //     setError("Error processing complaint: " + err.message);
  //     console.error(err);
  //   } finally {
  //     setIsProcessing(false);
  //     setProcessingStage("");
  //   }
  // };
  const processComplaint = async () => {
    // 1. Text is now required by the new Python API
    if (!complaintText.trim()) {
      setError('Please enter complaint text. The AI model requires it.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProcessingStage('Initializing AI analysis...');
    setSubmitSuccess(false);
    
    try {
      setProcessingStage('Analyzing with local AI models...');

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

      // 5. Get the unified result from your Python model
      const result = data.result;
      console.log("Local AI Result:", result);
      // 6. Logic to determine the best category for department mapping
      let finalCategory = result.text_category;
      
      // If text confidence is low (< 50%) AND an image category exists,
      // trust the image category more for department mapping.
      if (result.text_category_confidence < 0.5 && result.image_category) {
        finalCategory = result.image_category;
      }

      // 7. Get department info using the finalized category
      const departmentInfo = categorizeComplaint(finalCategory); 
      
      // Map string urgency from predict.py to a 0-1 score for the UI
      const urgencyMap = {
        "low": 0.3,
        "medium": 0.6,
        "high": 0.9,
      };
      const urgencyScore = urgencyMap[result.urgency.toLowerCase()] || 0.6;
      
      // Adjust priority based on the model's urgency
      let adjustedPriority = departmentInfo.priority;
      if (urgencyScore > 0.7) {
        adjustedPriority = 'High';
      } else if (urgencyScore < 0.4) {
        adjustedPriority = 'Low';
      }

      // Map your model's emotion to a sentiment string for the UI
      const sentimentMap = {
        "anger": "Negative - Urgent Attention",
        "fear": "Negative - Issue",
        "sadness": "Negative - Issue",
        "disgust": "Negative - Issue",
        "joy": "Positive - Constructive",
        "optimism": "Positive - Constructive",
        "love": "Positive - Constructive",
        "neutral": "Neutral - Reporting Issue"
      };
      const sentiment = sentimentMap[result.emotion.toLowerCase()] || 'Neutral - Reporting Issue';

      // 8. Set the final state object
      setResults({
        category: finalCategory, // Use the new finalCategory
        confidence: result.text_category_confidence,
        department: departmentInfo.dept, // From new logic
        priority: adjustedPriority, // Use the re-adjusted priority
        estimatedTime: result.predicted_resolution_readable, // Use new 'readable' time
        emotion: result.emotion,
        sentiment: sentiment,
        urgency: urgencyScore,
        imageDescription: result.image_category ? `AI detected: ${result.image_category}` : null,
        analysisSource: 'Local Python AI Model',
        rawSentiment: result.emotion,
        sentimentConfidence: result.emotion_confidence,
        textAnalysis: null, // This is no longer provided
      });
      
      setSelectedCategory(finalCategory); // Use the new finalCategory
      setProcessingStage("Analysis complete!");

    } catch (err) {
      // The new API sends back detailed errors
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
      category: newCategory,
      department: departmentInfo.dept,
      priority: departmentInfo.priority,
      estimatedTime: departmentInfo.time,
    }));
    
    setSelectedCategory(newCategory);
    setIsEditingCategory(false);
  };

 const submitComplaint = async () => {
  if (!results) return;
  
  setIsSubmitting(true);
  setError(null);

  try {
    // Compress image if it exists
    let compressedImage = null;
    if (imageFile) {
      compressedImage = await compressAndEncodeImage(imageFile);
    }

    const complaintData = {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
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
                <p className="text-sm text-gray-600">AI-Powered Complaint Analysis System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-600">Powered by Custom AI Model</span>
              <a
              href="/track"
  className="ml-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-indigo-200 transition-all duration-200 border border-indigo-200"
>
  Track Complaint
</a>
<button
  onClick={() => setShowAbout(true)}
  className="ml-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-blue-200 transition-all duration-200 border border-blue-200"
>
  About
</button>
            </div>
          </div>
        </div>
      </div>

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  About GrievEase
                </h2>
              </div>
              <button onClick={() => setShowAbout(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              GrievEase is an AI-powered complaint analysis and management platform designed to automate the process of understanding, prioritizing, and routing public complaints.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Features</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start space-x-2">
                <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <span><strong>AI Text Analysis</strong> — DistilBERT model classifies complaint category, emotion and urgency</span>
              </li>
              <li className="flex items-start space-x-2">
                <Image className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
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
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-10 text-center animate-fadeIn">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-gray-600 text-lg mb-2">
              Thank you for reaching out to us.
            </p>
            <p className="text-gray-600 mb-6">
              Your complaint has been successfully recorded in our system and assigned to the <strong>{results?.department}</strong>. It will be resolved within <strong>{results?.estimatedTime}</strong>.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 mb-4 text-left space-y-2">
              <p className="text-sm text-gray-600"><span className="font-medium">Category:</span> {results?.category}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Priority:</span> {results?.priority}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">Department:</span> {results?.department}</p>
            </div>
            {submittedComplaintId && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
                <p className="text-xs text-indigo-500 font-medium mb-1">YOUR COMPLAINT ID</p>
                <p className="text-lg font-bold text-indigo-700 font-mono tracking-wider">{submittedComplaintId}</p>
                <p className="text-xs text-indigo-400 mt-1">Save this ID to track your complaint</p>
              </div>
            )}
            <div className="space-y-3">
              <button
                onClick={() => window.open(`/track?id=${submittedComplaintId}`, '_blank')}
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
            {/* Image Upload */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-blue-600" />
                Upload Image (Optional)
              </h2>
              
              {!preview ? (
                <div
                  className={`border-3 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drag & drop your image here
                  </p>
                  <p className="text-sm text-gray-500 mb-6">or</p>
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
                  <p className="text-xs text-gray-400 mt-4">
                    Supports: JPG, PNG, GIF (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden shadow-md">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-contain bg-gray-100"
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
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2 text-indigo-600" />
                Describe Your Complaint (Optional)
              </h2>
              
              <textarea
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="Describe the issue you're facing... (e.g., 'There is a large pothole on Main Street causing traffic issues' or 'Garbage bins haven't been collected for 3 days')"
                className="w-full h-48 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-gray-700 placeholder-gray-400"
              />
              
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>{complaintText.length} characters</span>
                <span className="flex items-center">
                  <Brain className="w-4 h-4 mr-1" />
                  AI will analyze your text
                </span>
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={processComplaint}
              disabled={isProcessing || (!imageFile && !complaintText.trim())}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg flex items-center justify-center space-x-2 ${
                isProcessing || (!imageFile && !complaintText.trim())
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                <p className="text-blue-700 text-sm font-medium">{processingStage}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {submitSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-700 font-medium">Complaint Submitted Successfully!</p>
                  <p className="text-green-600 text-sm mt-1">Your complaint has been saved to the database.</p>
                </div>
              </div>
            )}

            {/* AI Features Info */}
            
          </div>

          {/* Results Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-indigo-600" />
                AI Analysis Results
              </h2>

              {!results && !isProcessing && (
                <div className="text-center py-16">
                  <Image className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Add image or text to see AI analysis</p>
                  <p className="text-gray-400 text-sm mt-2">
                    You can use either image alone, text alone, or both together
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-700 text-lg font-medium">Processing with AI...</p>
                  <p className="text-gray-500 text-sm mt-2">Running multiple AI models for accurate analysis</p>
                </div>
              )}

              {results && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Analysis Source */}
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-700">Analysis Method: {results.analysisSource}</p>
                  </div>

                  {/* Category with Edit Option */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Detected Category</span>
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
                            className="text-gray-600 hover:text-gray-700 p-1 rounded"
                            title="Cancel edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {!isEditingCategory ? (
                      <p className="text-2xl font-bold text-gray-900">{results.category}</p>
                    ) : (
                      <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full text-xl font-bold text-gray-900 bg-white border-2 border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                    
                    {results.imageDescription && (
                      <p className="text-xs text-gray-500 mt-2">Image shows: {results.imageDescription}</p>
                    )}
                    
                    {isEditingCategory && (
                      <p className="text-xs text-blue-600 mt-2 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Category changed manually - department will update automatically
                      </p>
                    )}
                  </div>

                  {/* Confidence & Emotion */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-xs font-medium text-gray-600">Confidence</span>
                      </div>
                      <p className="text-xl font-bold text-green-700">
                        {(results.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center mb-2">
                        <Brain className="w-4 h-4 text-purple-600 mr-2" />
                        <span className="text-xs font-medium text-gray-600">Emotion</span>
                      </div>
                      <p className="text-xl font-bold text-purple-700">{results.emotion}</p>
                      {results.rawSentiment && (
                        <p className="text-xs text-purple-600 mt-1">
                          ({results.rawSentiment} - {(results.sentimentConfidence * 100).toFixed(0)}%)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Department */}
                  <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
                    <div className="flex items-center mb-2">
                      <Building2 className="w-5 h-5 text-amber-600 mr-2" />
                      <span className="text-sm font-medium text-gray-600">Assigned Department</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{results.department}</p>
                  </div>

                  {/* Priority & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${
                      results.priority === 'High' ? 'bg-red-50 border-red-100' :
                      results.priority === 'Medium' ? 'bg-yellow-50 border-yellow-100' :
                      'bg-blue-50 border-blue-100'
                    }`}>
                      <span className="text-xs font-medium text-gray-600">Priority Level</span>
                      <p className={`text-lg font-bold mt-1 ${
                        results.priority === 'High' ? 'text-red-700' :
                        results.priority === 'Medium' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>{results.priority}</p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center mb-1">
                        <Clock className="w-4 h-4 text-blue-600 mr-1" />
                        <span className="text-xs font-medium text-gray-600">Est. Time</span>
                      </div>
                      <p className="text-lg font-bold text-blue-700">{results.estimatedTime}</p>
                    </div>
                  </div>

                  {/* Sentiment & Urgency */}
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Sentiment Analysis</h4>
                    <div className="space-y-2">
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Urgency Score:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {(results.urgency * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            results.urgency > 0.7 ? 'bg-gradient-to-r from-orange-500 to-red-600' :
                            results.urgency > 0.5 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-green-500 to-yellow-500'
                          }`}
                          style={{ width: `${results.urgency * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {results.urgency > 0.7 ? '⚠️ High urgency - needs immediate attention' :
                         results.urgency > 0.5 ? '⏱️ Moderate urgency - timely response needed' :
                         '✓ Low urgency - routine maintenance'}
                      </p>
                    </div>
                  </div>

                  {/* Alternative Categories */}
                  {results.textAnalysis && results.textAnalysis.length > 1 && (
                    <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Alternative Matches</h4>
                      <div className="space-y-2">
                        {results.textAnalysis.slice(1, 3).map((alt, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{alt.category}</span>
                            <span className="font-medium text-indigo-700">
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
                      className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
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