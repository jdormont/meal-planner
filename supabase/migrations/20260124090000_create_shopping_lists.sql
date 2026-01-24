-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'My Shopping List',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1.0,
    unit TEXT NOT NULL DEFAULT 'each',
    display_text TEXT,
    is_checked BOOLEAN NOT NULL DEFAULT false,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
    product_id TEXT,
    upc TEXT,
    meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Policies for shopping_lists
CREATE POLICY "Users can view their own shopping lists"
    ON public.shopping_lists
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping lists"
    ON public.shopping_lists
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping lists"
    ON public.shopping_lists
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping lists"
    ON public.shopping_lists
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for shopping_list_items
CREATE POLICY "Users can view items in their lists"
    ON public.shopping_list_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert items into their lists"
    ON public.shopping_list_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update items in their lists"
    ON public.shopping_list_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete items from their lists"
    ON public.shopping_list_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.shopping_lists
            WHERE shopping_lists.id = shopping_list_items.list_id
            AND shopping_lists.user_id = auth.uid()
        )
    );

-- Triggers for updated_at
CREATE TRIGGER update_shopping_lists_updated_at
    BEFORE UPDATE ON public.shopping_lists
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_shopping_list_items_updated_at
    BEFORE UPDATE ON public.shopping_list_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
