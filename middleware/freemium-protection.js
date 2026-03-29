// Luter Freemium API Middleware
// This middleware should be implemented in your backend API routes
// Below are examples for different frameworks

// =============================================
// NODE.JS/EXPRESS MIDDLEWARE
// =============================================

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Middleware to check if user can access a course
 */
const checkCourseAccess = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID required' });
    }

    // Check if user can access the course
    const { data: canAccess, error: accessError } = await supabase
      .rpc('can_access_course', {
        p_user_id: user.id,
        p_course_id: courseId
      });

    if (accessError || !canAccess) {
      return res.status(403).json({ 
        error: 'Premium subscription required to access this course',
        requiresUpgrade: true
      });
    }

    // Add user to request for downstream use
    req.user = user;
    next();
  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check feature limits
 */
const checkFeatureLimit = (featureType) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Check if user is premium
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();

      if (profile?.is_premium) {
        req.user = user;
        return next();
      }

      // Check feature limit
      const { data: canUseFeature, error: limitError } = await supabase
        .rpc('check_feature_limit', {
          p_user_id: user.id,
          p_feature_type: featureType
        });

      if (limitError || !canUseFeature) {
        return res.status(429).json({ 
          error: `Daily limit for ${featureType} exceeded. Upgrade to Premium for unlimited access.`,
          requiresUpgrade: true,
          featureType
        });
      }

      // Record usage
      await supabase.rpc('record_feature_usage', {
        p_user_id: user.id,
        p_feature_type: featureType
      });

      req.user = user;
      next();
    } catch (error) {
      console.error('Feature limit check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// =============================================
// USAGE EXAMPLES
// =============================================

// AI Summary endpoint
app.post('/api/ai/summary', 
  checkFeatureLimit('ai_summary'),
  async (req, res) => {
    // Your AI summary logic here
    res.json({ summary: 'Generated summary...' });
  }
);

// Assignment Solution endpoint
app.post('/api/ai/assignment-solution', 
  checkCourseAccess,
  async (req, res) => {
    // Your assignment solution logic here
    res.json({ solution: 'Generated solution...' });
  }
);

// Quiz Battle endpoint
app.post('/api/quiz/battle', 
  checkFeatureLimit('quiz_battle'),
  async (req, res) => {
    // Your quiz battle logic here
    res.json({ battle: 'Battle created...' });
  }
);

// =============================================
// NEXT.JS API MIDDLEWARE
// =============================================

// middleware.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only protect API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Check premium status for premium features
  if (pathname.includes('/api/ai/') || pathname.includes('/api/quiz/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single();

    if (!profile?.is_premium) {
      // Check specific feature limits
      const featureType = pathname.includes('summary') ? 'ai_summary' : 
                         pathname.includes('quiz') ? 'quiz_battle' : 
                         'assignment_solution';

      const { data: canUseFeature } = await supabase
        .rpc('check_feature_limit', {
          p_user_id: user.id,
          p_feature_type: featureType
        });

      if (!canUseFeature) {
        return NextResponse.json({ 
          error: 'Daily limit exceeded. Upgrade to Premium.',
          requiresUpgrade: true 
        }, { status: 429 });
      }

      // Record usage
      await supabase.rpc('record_feature_usage', {
        p_user_id: user.id,
        p_feature_type: featureType
      });
    }
  }

  // Check course access for course-specific endpoints
  if (pathname.includes('/course/')) {
    const courseId = pathname.split('/course/')[1]?.split('/')[0];
    if (courseId) {
      const { data: canAccess } = await supabase
        .rpc('can_access_course', {
          p_user_id: user.id,
          p_course_id: courseId
        });

      if (!canAccess) {
        return NextResponse.json({ 
          error: 'Premium subscription required.',
          requiresUpgrade: true 
        }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

// =============================================
// CLIENT-SIDE ACCESS CHECKS (Frontend Security)
// =============================================

// Helper function to check access before making API calls
export const checkAccessBeforeCall = async (supabase, courseId, featureType) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check premium status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', user.id)
    .single();

  if (profile?.is_premium) return true;

  // Check course access
  if (courseId) {
    const { data: canAccess } = await supabase
      .rpc('can_access_course', {
        p_user_id: user.id,
        p_course_id: courseId
      });
    
    if (!canAccess) {
      throw new Error('PREMIUM_REQUIRED');
    }
  }

  // Check feature limits
  if (featureType) {
    const { data: canUseFeature } = await supabase
      .rpc('check_feature_limit', {
        p_user_id: user.id,
        p_feature_type: featureType
      });
    
    if (!canUseFeature) {
      throw new Error('LIMIT_EXCEEDED');
    }
  }

  return true;
};

// Usage in React components
export const makeSecureAPICall = async (supabase, endpoint, courseId, featureType, body) => {
  try {
    await checkAccessBeforeCall(supabase, courseId, featureType);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.requiresUpgrade) {
        throw new Error('PREMIUM_REQUIRED');
      }
      throw new Error(error.error || 'API call failed');
    }

    return await response.json();
  } catch (error) {
    if (error.message === 'PREMIUM_REQUIRED') {
      // Show premium modal
      window.location.href = '/dashboard/pricing';
    } else if (error.message === 'LIMIT_EXCEEDED') {
      // Show limit exceeded message
      alert('Daily limit exceeded. Upgrade to Premium for unlimited access.');
    } else {
      throw error;
    }
  }
};
