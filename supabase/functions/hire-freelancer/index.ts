import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const PORT = Number(Deno.env.get('PORT') || 8000);
Deno.serve({ port: PORT }, async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing Supabase env vars' }),
        { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    const { bidId } = body || {};
    if (!bidId) {
      return new Response(
        JSON.stringify({ error: 'Bid ID is required' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*, gigs!inner(owner_id, status)')
      .eq('id', bidId)
      .single();

    if (bidError || !bid) {
      return new Response(
        JSON.stringify({ error: 'Bid not found' }),
        { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    if (bid.gigs.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only gig owner can hire' }),
        { status: 403, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    if (bid.gigs.status === 'assigned') {
      return new Response(
        JSON.stringify({ error: 'Gig already has a hired freelancer' }),
        { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateBidError } = await supabase
      .from('bids')
      .update({ status: 'hired' })
      .eq('id', bidId);

    if (updateBidError) {
      throw updateBidError;
    }

    const { error: rejectOthersError } = await supabase
      .from('bids')
      .update({ status: 'rejected' })
      .eq('gig_id', bid.gig_id)
      .neq('id', bidId);

    if (rejectOthersError) {
      throw rejectOthersError;
    }

    const { error: updateGigError } = await supabase
      .from('gigs')
      .update({ status: 'assigned' })
      .eq('id', bid.gig_id);

    if (updateGigError) {
      throw updateGigError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Freelancer hired successfully' }),
      { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error hiring freelancer:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
});