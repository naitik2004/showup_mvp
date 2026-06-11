'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();

    const [currentUserId, setCurrentUserId] = useState('');
    const [friendStatus, setFriendStatus] = useState('none');


    const profileId = params.id as string;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profileId) return;

        const fetchProfile = async () => {

            const {
                data: { user },
            } = await supabase.auth.getUser();

            setCurrentUserId(user?.id || '');
            if (user) {
                await checkFriendship(user.id, profileId);
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', profileId)
                .single();

            if (error) {
                console.error(error);
            } else {
                setProfile(data);
            }

            setLoading(false);
        };

        fetchProfile();
    }, [profileId,]);

    const checkFriendship = async (
        currentUserId: string,
        profileId: string
    ) => {

        const { data: friend } = await supabase
            .from('friends')
            .select('*')
            .or(
                `and(user_id.eq.${currentUserId},friend_id.eq.${profileId}),
                and(user_id.eq.${profileId},friend_id.eq.${currentUserId})`
            )
            .maybeSingle();

        if (friend) {
            setFriendStatus('friends');
            return;
        }

        const { data: request } = await supabase
            .from('friend_requests')
            .select('*')
            .or(
                `and(sender_id.eq.${currentUserId},receiver_id.eq.${profileId}),
                and(sender_id.eq.${profileId},receiver_id.eq.${currentUserId})`
            )
            .eq('status', 'pending')
            .maybeSingle();

        if (request) {
            if (request.sender_id === currentUserId) {
                setFriendStatus('pending');
            } else {
                setFriendStatus('accept');
            }
        }
    };

    const sendFriendRequest = async () => {

    const { error } = await supabase
        .from('friend_requests')
        .insert({
            sender_id: currentUserId,
            receiver_id: profileId,
        });

    if (!error) {
        console.error(error);
        return;
    }
    setFriendStatus('pending');
};

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-cream">
                Loading profile...
            </div>
        );
    }

    if (!profile) {
        return <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-cream">User not found</div>;
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-cream">
            <div className="max-w-5xl mx-auto p-6">
                <button
                    onClick={() => router.back()}
                    className="mb-4"
                >
                    ← Back
                </button>

                <div className="bg-surface/40 border border-muted rounded-3xl p-6">

                    <div className="flex justify-between items-center">

                        <div className="flex items-center gap-5">

                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-primary flex items-center justify-center text-4xl font-bold bg-black">
                                    {profile.name?.charAt(0).toUpperCase()}
                                </div>

                                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                            </div>

                            <div>
                                <h1 className="text-4xl font-black">
                                    {profile.name}
                                </h1>

                                <p className="text-muted-foreground">
                                    📍 {profile.city}
                                </p>

                                <p className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
                                    Member Since {new Date(profile.created_at).getFullYear()}
                                </p>
                            </div>

                        </div>

                        {currentUserId !== profileId && (
                            <button
                                onClick={sendFriendRequest}
                                disabled={friendStatus !== 'none'}
                                className="px-5 py-3 rounded-2xl bg-primary text-black font-bold"
                            >
                                {friendStatus === 'none' && 'Add Friend'}
                                {friendStatus === 'pending' && 'Pending'}
                                {friendStatus === 'accept' && 'Accept Request'}
                                {friendStatus === 'friends' && 'Friends'}
                            </button>
                        )}




                    </div>

                </div>

            


            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-surface/40 rounded-3xl p-6 text-center aspect-square flex flex-col justify-center">
                    <p className="text-3xl font-bold text-primary">
                        {profile.games_joined}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Joined
                    </p>
                </div>

                <div className="bg-surface/40 rounded-3xl p-6 text-center aspect-square flex flex-col justify-center">
                    <p className="text-3xl font-bold text-primary">
                        {profile.games_hosted}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Hosted
                    </p>
                </div>

                <div className="bg-surface/40 rounded-3xl p-6 text-center aspect-square flex flex-col justify-center">
                    <p className="text-3xl font-bold text-primary">
                        {profile.sports?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Sports
                    </p>
                </div>

                <div className="bg-surface/40 rounded-3xl p-6 text-center aspect-square flex flex-col justify-center">
                    <p className="text-3xl font-bold text-primary">
                        0
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Friends
                    </p>
                </div>
            </div>

            <div className="mt-8 bg-surface/40 rounded-3xl border border-primary/20 p-6">

                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                    Player Level
                </p>

                <h2 className="text-6xl font-black text-primary mt-4">
                    {profile.skill_level?.toUpperCase()}
                </h2>

                <p className="text-muted-foreground mt-2">
                    Elite competitor
                </p>

            </div>


            <div className="mt-8">

                <h2 className="text-xl font-bold mb-4">
                    Favorite Sports
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                    {profile.sports?.map((sport: string) => (
                        <div
                            key={sport}
                            className="bg-surface/40 rounded-3xl p-5 text-center"
                        >
                            <div className="text-4xl mb-3">
                                {sport === 'badminton' && '🏸'}
                                {sport === 'football' && '⚽'}
                                {sport === 'basketball' && '🏀'}
                                {sport === 'tennis' && '🎾'}
                            </div>

                            <p className="font-bold capitalize">
                                {sport}
                            </p>
                        </div>
                    ))}

                </div>


            </div>

            </div>

        </div>

    );
}