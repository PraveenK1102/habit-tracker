import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { z } from 'zod';
import { requireUser } from '@/lib/api/auth';
import { handleApiError, ok, readJsonValidated } from '@/lib/api/http';

export const dynamic = 'force-dynamic';

/**
 * Minimal placeholder endpoint.
 * We intentionally removed all RAG/vector/AI logic for now.
 */
export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    await requireUser(supabase);

    const body = await readJsonValidated(
      request,
      z.object({
        message: z.string().trim().min(1).max(2000),
        conversationId: z.string().trim().max(100).optional(),
      })
    );

    return ok(
      {
        message:
          'LLMChatbot is currently disabled (RAG/vector/AI code removed). Next step: decide how to answer using SQL data safely.',
        echo: body.message,
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    await requireUser(supabase);
    return ok(
      {
        status: 'ok',
        service: 'llmchatbot',
        note: 'Placeholder endpoint. AI/RAG intentionally removed.',
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}


