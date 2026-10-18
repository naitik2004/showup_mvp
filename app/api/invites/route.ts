import { NextResponse } from 'next/server';
import { apiError, getInviteActor } from '@/lib/server-invites';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await getInviteActor();
    const url = new URL(request.url);
    const gameId = url.searchParams.get('gameId');
    if (gameId) {
      const [{ data: membership, error: memberError }, { data: relationships, error: friendError }, { data: members, error: membersError }, { data: pending, error: pendingError }, { data: blocks, error: blockError }] = await Promise.all([
        supabase.from('group_members').select('id').eq('group_id', gameId).eq('user_id', userId).eq('status', 'accepted').maybeSingle(),
        supabase.from('friendships').select('user_a,user_b').or(`user_a.eq.${userId},user_b.eq.${userId}`).eq('status', 'accepted'),
        supabase.from('group_members').select('user_id').eq('group_id', gameId).eq('status', 'accepted'),
        supabase.from('game_invites').select('to_user').eq('game_id', gameId).eq('from_user', userId).eq('status', 'pending'),
        supabase.from('user_blocks').select('blocker_id,blocked_id').or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      ]);
      const queryError = memberError || friendError || membersError || pendingError || blockError;
      if (queryError) throw queryError;
      if (!membership) return NextResponse.json({ error: 'Join this match before inviting friends.' }, { status: 403 });
      const friendIds = (relationships || []).map((friendship) => friendship.user_a === userId ? friendship.user_b : friendship.user_a);
      const memberIds = new Set((members || []).map((member) => member.user_id));
      const invitedIds = new Set((pending || []).map((invite) => invite.to_user));
      const blockedIds = new Set((blocks || []).map((block) => block.blocker_id === userId ? block.blocked_id : block.blocker_id));
      const availableIds = friendIds.filter((id) => !memberIds.has(id) && !blockedIds.has(id));
      if (!availableIds.length) return NextResponse.json({ friends: [] });
      const { data: friends, error: usersError } = await supabase.from('profiles').select('id,name').in('id', availableIds).order('name');
      if (usersError) throw usersError;
      return NextResponse.json({ friends: (friends || []).map((friend) => ({ ...friend, invited: invitedIds.has(friend.id) })) });
    }

    const { data: invites, error } = await supabase.from('game_invites')
      .select('id,game_id,from_user,to_user,created_at,status,game:game_groups!game_invites_game_id_fkey(id,sport,location_name,scheduled_at,max_players,status),sender:profiles!game_invites_from_user_fkey(id,name)')
      .eq('to_user', userId).eq('status', 'pending').order('created_at', { ascending: false });
    if (error) throw error;
    const gameIds = (invites || []).map((invite: any) => invite.game_id);
    const { data: memberships, error: membershipError } = gameIds.length
      ? await supabase.from('group_members').select('group_id').in('group_id', gameIds).eq('status', 'accepted')
      : { data: [], error: null };
    if (membershipError) throw membershipError;
    const counts = new Map<string, number>();
    for (const membership of memberships || []) counts.set(membership.group_id, (counts.get(membership.group_id) || 0) + 1);
    return NextResponse.json({ invites: (invites || []).map((invite: any) => ({ ...invite, member_count: counts.get(invite.game_id) || 0 })), count: invites?.length || 0 });
  } catch (error: any) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await getInviteActor();
    const body = await request.json();
    const action = body?.action;

    if (action === 'decline') {
      const { data, error } = await supabase.from('game_invites').update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', body.inviteId).eq('to_user', userId).eq('status', 'pending').select('id').maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Invite not found or already answered.' }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    if (action === 'accept') {
      const { data, error } = await supabase.rpc('accept_game_invite', { p_invite_id: body.inviteId });
      if (error) return NextResponse.json({ error: error.message }, { status: error.message.startsWith('Too late.') ? 409 : 400 });
      return NextResponse.json({ ok: true, ...data });
    }

    if (action === 'send') {
      const gameId = String(body.gameId || '');
      const friendId = String(body.friendId || '');
      const [{ data: membership, error: memberError }, { data: friendship, error: friendError }, { data: game, error: gameError }, { data: existingMember, error: existingMemberError }, { data: block, error: blockError }] = await Promise.all([
        supabase.from('group_members').select('id').eq('group_id', gameId).eq('user_id', userId).eq('status', 'accepted').maybeSingle(),
        supabase.from('friendships').select('id').eq('status', 'accepted').or(`and(user_a.eq.${userId},user_b.eq.${friendId}),and(user_a.eq.${friendId},user_b.eq.${userId})`).maybeSingle(),
        supabase.from('game_groups').select('id,status').eq('id', gameId).maybeSingle(),
        supabase.from('group_members').select('id').eq('group_id', gameId).eq('user_id', friendId).eq('status', 'accepted').maybeSingle(),
        supabase.from('user_blocks').select('blocker_id').or(`and(blocker_id.eq.${userId},blocked_id.eq.${friendId}),and(blocker_id.eq.${friendId},blocked_id.eq.${userId})`).maybeSingle(),
      ]);
      const queryError = memberError || friendError || gameError || existingMemberError || blockError;
      if (queryError) throw queryError;
      if (!membership) return NextResponse.json({ error: 'Join this match before inviting friends.' }, { status: 403 });
      if (!game || !['open', 'full', 'in_progress'].includes(game.status)) return NextResponse.json({ error: 'This match is no longer accepting invites.' }, { status: 409 });
      if (!friendship) return NextResponse.json({ error: 'You can only invite friends.' }, { status: 403 });
      if (block) return NextResponse.json({ error: 'This invite cannot be sent.' }, { status: 403 });
      if (existingMember) return NextResponse.json({ ok: true, already_member: true });
      const { error: insertError } = await supabase.from('game_invites').insert({ game_id: gameId, from_user: userId, to_user: friendId, status: 'pending' });
      if (insertError?.code === '23505') return NextResponse.json({ ok: true, already_invited: true });
      if (insertError) throw insertError;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown invite action.' }, { status: 400 });
  } catch (error: any) {
    return apiError(error);
  }
}
