-- Enable Realtime for game_groups table
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_groups;

-- Enable Realtime for group_members table
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;

-- Enable Realtime for messages table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
