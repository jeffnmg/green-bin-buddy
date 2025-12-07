import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      console.error('GROQ_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract the user from the Authorization header (JWT is verified by Supabase)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user's internal ID from our users table
    const { data: userRecord, error: userRecordError } = await supabase
      .from('users')
      .select('id, puntos, objetos_escaneados, racha_actual')
      .eq('auth_user_id', user.id)
      .single();

    if (userRecordError) {
      console.error('Error fetching user record:', userRecordError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userRecord.id;

    // Get last 3 scans
    const { data: scansData, error: scansError } = await supabase
      .from('scans')
      .select('objeto_detectado_espanol, objeto_detectado, tipo_residuo, reciclable, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (scansError) {
      console.error('Error fetching scans:', scansError);
    }

    // Format last scans for context
    const ultimosEscaneos = scansData?.map(scan => 
      `${scan.objeto_detectado_espanol || scan.objeto_detectado} (${scan.tipo_residuo || 'N/A'}, ${scan.reciclable ? 'reciclable' : 'no reciclable'})`
    ).join(', ') || 'Sin escaneos recientes';

    const systemPrompt = `Eres un asistente experto en reciclaje y medio ambiente en Colombia.
Respondes preguntas sobre reciclaje de forma clara y motivadora.

Contexto del usuario:
- Puntos: ${userRecord?.puntos || 0}
- Objetos escaneados: ${userRecord?.objetos_escaneados || 0}
- Racha: ${userRecord?.racha_actual || 0} días
- Últimos escaneos: ${ultimosEscaneos}

Usa este contexto para personalizar tus respuestas.
Sé breve (máximo 3 párrafos).
Usa emojis ocasionalmente.
Motiva al usuario a seguir reciclando.`;

    console.log('Calling Groq API with message:', message);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Error calling Groq API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const botResponse = data.choices[0]?.message?.content || 'Lo siento, no pude procesar tu pregunta.';

    console.log('Groq response received successfully');

    return new Response(
      JSON.stringify({ response: botResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
