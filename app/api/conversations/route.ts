import { createSupabaseServerClient } from '@/lib/supabaseServer'; 
import { requireUser } from '@/lib/api/auth';
import { handleApiError, ok } from '@/lib/api/http';

const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await requireUser(supabase);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE), 10)));

    const offset = (page - 1) * limit;

    // Step 1: Get conversations where user is a participant
    const { data: rawConversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        type,
        name,
        created_by,
        direct_key,
        created_at,
        conversation_participants!inner(user_id)
      `)
      .eq('conversation_participants.user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit);

    if (error) {
      throw error;
    }

    const hasNextPage = rawConversations.length > limit;
    const paginatedConversations = hasNextPage 
      ? rawConversations.slice(0, limit) 
      : rawConversations;

    // Step 2: For direct conversations, get the OTHER participant's profile
    // Filter to only direct conversation IDs
    const directConversationIds = paginatedConversations
      .filter(c => c.type === 'direct')
      .map(c => c.id);

    let otherParticipantsMap: Record<string, { name: string; email: string }> = {};

    if (directConversationIds.length > 0) {
      // Get the other participants (not the current user)
      const { data: otherParticipants, error: otherError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          profiles(name, email)
        `)
        .in('conversation_id', directConversationIds)
        .neq('user_id', user.id);  // Get OTHER participants, not current user

      console.log('Other participants query:', { 
        directConversationIds, 
        otherParticipants, 
        otherError 
      });

      // Create a lookup map: conversation_id -> profile
      otherParticipantsMap = (otherParticipants || []).reduce((acc, p) => {
        // profiles can be object or array depending on FK setup
        const profiles = p.profiles as unknown;
        const profile = Array.isArray(profiles) ? profiles[0] : profiles;
        if (profile && typeof profile === 'object' && 'name' in profile) {
          acc[p.conversation_id] = profile as { name: string; email: string };
        }
        return acc;
      }, {} as Record<string, { name: string; email: string }>);
    }

    // Step 3: Transform data - create unified 'display_name' field
    const results = paginatedConversations.map(conv => {
      // Remove the nested conversation_participants from response
      const { conversation_participants, ...rest } = conv;

      let display_name: string;
      let display_email: string | null = null;

      if (conv.type === 'group') {
        // For groups: use the conversation's name column
        display_name = conv.name || 'Unnamed Group';
      } else {
        // For direct: use the other participant's profile name
        const otherProfile = otherParticipantsMap[conv.id];
        display_name = otherProfile?.name || 'Unknown User';
        display_email = otherProfile?.email || null;
      }

      return {
        ...rest,
        display_name,
        display_email,
      };
    });

    return ok({
      results,
      page_context: {
        page,
        limit,
        hasNextPage,
        hasPrevPage: page > 1,
      },
    }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}