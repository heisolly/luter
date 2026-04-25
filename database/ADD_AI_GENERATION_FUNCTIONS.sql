-- =====================================================
-- ADD AI GENERATION FUNCTIONS FOR UNIVERSAL SYSTEM
-- =====================================================

-- Function to generate AI curriculum using Groq
CREATE OR REPLACE FUNCTION generate_ai_curriculum(
    p_education_level TEXT,
    p_subject_name TEXT,
    p_grade_level TEXT DEFAULT NULL,
    p_university TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_course_code TEXT DEFAULT NULL,
    p_country TEXT DEFAULT 'Nigeria',
    p_template_type TEXT DEFAULT 'tertiary_weeks'
) RETURNS UUID AS $$
DECLARE
    curriculum_id UUID;
    ai_config RECORD;
    prompt TEXT;
    ai_response JSONB;
    curriculum_structure JSONB;
BEGIN
    -- Get AI configuration
    SELECT * INTO ai_config FROM ai_generation_configs 
    WHERE config_name = 'Nigerian University Course Generator' AND is_active = TRUE;
    
    IF ai_config.id IS NULL THEN
        RAISE EXCEPTION 'AI generation configuration not found';
    END IF;
    
    -- Build prompt based on education level
    IF p_education_level = 'Tertiary' THEN
        prompt := format('Generate a comprehensive 16-week academic syllabus for %s %s at %s, Department of %s. 
        Course Code: %s. Return JSON structure with weeks array containing: 
        week_number (1-16), title, topics (array), readings (array), assignments (array), 
        learning_objectives (array), and assessment_methods (array). 
        Make it realistic and academically rigorous.',
        p_course_code, p_subject_name, p_university, p_department, p_course_code);
        
    ELSIF p_education_level IN ('Primary', 'Secondary') THEN
        prompt := format('Generate a comprehensive curriculum for %s %s: %s. 
        Return JSON structure with chapters array containing: 
        chapter_number, title, topics (array), learning_objectives (array), 
        activities (array), and assessment_methods (array). 
        Make it age-appropriate and engaging.',
        p_grade_level, p_education_level, p_subject_name);
        
    ELSIF p_education_level = 'Professional' THEN
        prompt := format('Generate a professional development curriculum for %s. 
        Return JSON structure with modules array containing: 
        module_number, title, topics (array), skills_gained (array), 
        practical_projects (array), duration_days, and assessment_criteria (array). 
        Focus on practical application and real-world skills.',
        p_subject_name);
    END IF;
    
    -- For now, create a placeholder structure
    -- In production, you would call your AI service here
    curriculum_structure := CASE 
        WHEN p_education_level = 'Tertiary' THEN 
            jsonb_build_object(
                'weeks', jsonb_agg(
                    jsonb_build_object(
                        'week_number', n,
                        'title', format('Week %s: Introduction to %s', n, split_part(p_subject_name, ' ', 1)),
                        'topics', jsonb_build_array(format('Topic %s.1', n), format('Topic %s.2', n)),
                        'readings', jsonb_build_array('Reading 1', 'Reading 2'),
                        'assignments', jsonb_build_array('Assignment 1'),
                        'learning_objectives', jsonb_build_array('Objective 1', 'Objective 2'),
                        'assessment_methods', jsonb_build_array('Quiz', 'Assignment')
                    )
                )
            )
        WHEN p_education_level IN ('Primary', 'Secondary') THEN
            jsonb_build_object(
                'chapters', jsonb_agg(
                    jsonb_build_object(
                        'chapter_number', n,
                        'title', format('Chapter %s: %s Basics', n, split_part(p_subject_name, ' ', 1)),
                        'topics', jsonb_build_array(format('Topic %s.1', n), format('Topic %s.2', n)),
                        'learning_objectives', jsonb_build_array('Objective 1', 'Objective 2'),
                        'activities', jsonb_build_array('Activity 1', 'Activity 2'),
                        'assessment_methods', jsonb_build_array('Exercise', 'Test')
                    )
                )
            )
        WHEN p_education_level = 'Professional' THEN
            jsonb_build_object(
                'modules', jsonb_agg(
                    jsonb_build_object(
                        'module_number', n,
                        'title', format('Module %s: %s Fundamentals', n, split_part(p_subject_name, ' ', 1)),
                        'topics', jsonb_build_array(format('Topic %s.1', n), format('Topic %s.2', n)),
                        'skills_gained', jsonb_build_array('Skill 1', 'Skill 2'),
                        'practical_projects', jsonb_build_array('Project 1'),
                        'duration_days', 7,
                        'assessment_criteria', jsonb_build_array('Criteria 1', 'Criteria 2')
                    )
                )
            )
    END FROM generate_series(1, 
        CASE 
            WHEN p_education_level = 'Tertiary' THEN 16
            WHEN p_education_level IN ('Primary', 'Secondary') THEN 10
            WHEN p_education_level = 'Professional' THEN 8
        END
    ) n;
    
    -- Create curriculum record
    INSERT INTO master_curriculum (
        education_level, subject_name, grade_level, university, department, course_code,
        curriculum_structure, source_type, country, created_by
    ) VALUES (
        p_education_level, p_subject_name, p_grade_level, p_university, p_department, p_course_code,
        curriculum_structure, 'ai_generated', p_country, auth.uid()
    ) RETURNING id INTO curriculum_id;
    
    RETURN curriculum_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_ai_curriculum TO authenticated;
GRANT EXECUTE ON FUNCTION generate_ai_curriculum TO service_role;

-- Enable security definer
ALTER FUNCTION generate_ai_curriculum SECURITY DEFINER;
ALTER FUNCTION generate_ai_curriculum RESET SEARCH_PATH;
