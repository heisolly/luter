-- ==========================================
-- CREATE EMAIL CAMPAIGNS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    design_json JSONB,
    html_body TEXT,
    audience_filter JSONB,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Turn on RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can view email campaigns"
    ON public.email_campaigns
    FOR SELECT
    USING (public.luter_is_admin());

CREATE POLICY "Admins can insert email campaigns"
    ON public.email_campaigns
    FOR INSERT
    WITH CHECK (public.luter_is_admin());

CREATE POLICY "Admins can update email campaigns"
    ON public.email_campaigns
    FOR UPDATE
    USING (public.luter_is_admin());

CREATE POLICY "Admins can delete email campaigns"
    ON public.email_campaigns
    FOR DELETE
    USING (public.luter_is_admin());
