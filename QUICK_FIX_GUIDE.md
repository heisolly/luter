# Luter App Quick Fix Guide

## Issues Identified & Solutions

### 1. Database Issues (CRITICAL)
**Problem**: Schema inconsistencies, RLS policy conflicts
**Solution**: Run the safe SQL fixes
- File: `database/FIXES_SAFE_SQL.sql`
- Go to Supabase Dashboard → SQL Editor
- Copy and paste the entire content
- Run the script

### 2. 406 API Errors (FIXED)
**Problem**: Supabase client configuration issues
**Status**: ✅ Fixed in `src/supabaseClient.js`
- Added proper headers and auth configuration
- Changed username check from `.single()` to `.maybeSingle()`

### 3. No Courses in Dashboard (ROOT CAUSE)
**Problem**: User didn't select courses during onboarding
**Solution**: Complete onboarding properly

### 4. Google OAuth Warnings (MINOR)
**Problem**: Client ID configuration warnings
**Status**: ⚠️ Needs Google Console fix

## Step-by-Step Fix Process

### Step 1: Apply Database Fixes (REQUIRED)
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select project: `knnfgyedoxtywwlhazqg`
3. Go to SQL Editor
4. Copy entire content from `database/FIXES_SAFE_SQL.sql`
5. Paste and run

### Step 2: Complete Onboarding (REQUIRED)
1. Start the app: `npm run dev:client`
2. Sign in with Google
3. Complete ALL onboarding steps:
   - Step 1: Account details
   - Step 2: Role selection
   - Step 3: Academic registry
   - Step 4: Discovery source
   - Step 5: **COURSE SELECTION** (IMPORTANT!)
   - Step 6: Study routine
   - Step 7: Goals
   - Step 8: Referral (optional)

### Step 3: Course Selection Guide
During Step 5 of onboarding:
1. Select at least 1-2 courses from the catalog
2. Or add manual courses using "Add Course" button
3. Click "CONTINUE" only after selecting courses
4. Complete remaining steps

### Step 4: Verify Dashboard
After completing onboarding:
1. You should be redirected to dashboard
2. Dashboard should show selected courses
3. Courses should be fetchable from database

## Common Issues & Solutions

### "No courses selected to upsert"
**Cause**: Skipping course selection step
**Fix**: Go back to onboarding and select courses

### "Fetched 0 user courses"
**Cause**: No courses enrolled during onboarding
**Fix**: Complete onboarding with course selection

### "406 Not Acceptable" errors
**Status**: ✅ Fixed with client configuration update

### Google OAuth warnings
**Status**: ⚠️ Non-critical, app still works
**Fix**: Add authorized origins in Google Console

## Testing Checklist

After applying fixes:
- [ ] Database fixes applied successfully
- [ ] No 406 errors in console
- [ ] Onboarding completes without errors
- [ ] Courses selected during onboarding
- [ ] Dashboard shows enrolled courses
- [ ] Course data is fetchable

## Next Steps

1. **Immediate**: Apply database fixes
2. **Required**: Complete onboarding with course selection
3. **Optional**: Fix Google OAuth warnings in Google Console

The main issue is that the user needs to actually select courses during onboarding. The database fixes will ensure the course enrollment process works properly.
