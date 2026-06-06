DROP POLICY IF EXISTS "Users can vote" ON public.poll_votes;
CREATE POLICY "Users can vote" ON public.poll_votes
  FOR INSERT
  WITH CHECK (
    (user_id = auth.uid())
    AND NOT EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_votes.poll_id AND p.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.poll_options po WHERE po.id = poll_votes.option_id AND po.poll_id = poll_votes.poll_id)
  );