// Supabase Edge Function for sending notifications to patients
// Deploy with: supabase functions deploy notify-patients

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationPayload {
  doctor_id: string
  action: 'check_queue' | 'send_notification'
}

const allowedOrigins = (Deno.env.get('CORS_ALLOWED_ORIGINS') || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}

function corsHeaders(origin: string | null): Record<string, string> {
  return origin ? { ...baseCorsHeaders, 'Access-Control-Allow-Origin': origin } : baseCorsHeaders
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
  origin: string | null = null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  const origin = req.headers.get('Origin')

  // Do not use wildcard CORS for a function holding the Supabase service-role key.
  if (origin && !allowedOrigins.includes(origin)) {
    return new Response('Origin not allowed', { status: 403, headers: baseCorsHeaders })
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing required Supabase Edge Function environment configuration.')
      return jsonResponse({ error: 'Notification service is not configured' }, 500, origin)
    }

    // Validate the caller's JWT using the public/anon client before using service-role access.
    const authorization = req.headers.get('Authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Authentication required' }, 401, origin)
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    })
    const { data: authData, error: authError } = await authClient.auth.getUser()
    if (authError || !authData.user) {
      return jsonResponse({ error: 'Invalid or expired session' }, 401, origin)
    }

    // Use the service-role client only after authenticating the caller.
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: callerProfile, error: callerProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle()

    if (callerProfileError) {
      console.error('Unable to read caller role:', callerProfileError.message)
      return jsonResponse({ error: 'Unable to verify account permissions' }, 500, origin)
    }

    if (!callerProfile || !['doctor', 'admin'].includes(callerProfile.role)) {
      return jsonResponse({ error: 'Doctor or administrator role required' }, 403, origin)
    }

    const payload = await req.json() as NotificationPayload
    const doctorId = typeof payload?.doctor_id === 'string' ? payload.doctor_id : ''
    const action = payload?.action

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(doctorId)) {
      return jsonResponse({ error: 'A valid doctor_id is required' }, 400, origin)
    }
    if (!['check_queue', 'send_notification'].includes(action)) {
      return jsonResponse({ error: 'Unsupported notification action' }, 400, origin)
    }

    // A doctor can trigger notifications only for their own doctor record.
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id, user_id')
      .eq('id', doctorId)
      .maybeSingle()

    if (doctorError) {
      console.error('Unable to verify doctor record:', doctorError.message)
      return jsonResponse({ error: 'Unable to verify doctor access' }, 500, origin)
    }
    if (!doctor) {
      return jsonResponse({ error: 'Doctor record not found' }, 404, origin)
    }
    if (callerProfile.role !== 'admin' && doctor.user_id !== authData.user.id) {
      return jsonResponse({ error: 'You may only trigger notifications for your own queue' }, 403, origin)
    }

    // Get notification threshold from settings.
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'notification_threshold')
      .single()

    const parsedThreshold = Number.parseInt(settings?.value || '3', 10)
    const threshold = Number.isFinite(parsedThreshold) ? Math.min(Math.max(parsedThreshold, 1), 100) : 3

    // Get SMS enabled setting.
    const { data: smsSettings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_enabled')
      .single()

    const smsEnabled = smsSettings?.value === 'true'

    // Get push enabled setting.
    const { data: pushSettings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'push_enabled')
      .single()

    const pushEnabled = pushSettings?.value === 'true'

    if (!smsEnabled && !pushEnabled) {
      return jsonResponse({ message: 'Notifications are disabled' }, 200, origin)
    }

    // Get current queue for the authorized doctor.
    const today = new Date().toISOString().split('T')[0]
    const { data: queue, error: queueError } = await supabase
      .from('appointments')
      .select('id, token_number, patient_id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .eq('status', 'waiting')
      .order('token_number')

    if (queueError) {
      console.error('Unable to read doctor queue:', queueError.message)
      return jsonResponse({ error: 'Unable to read queue' }, 500, origin)
    }

    if (!queue || queue.length < threshold) {
      return jsonResponse({
        message: 'Not enough patients in queue',
        queue_length: queue?.length || 0,
      }, 200, origin)
    }

    // Get the patient at the threshold position.
    const patientToNotify = queue[threshold - 1]

    // Avoid sending duplicate notifications to the same patient within the last hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: existingNotification } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('appointment_id', patientToNotify.id)
      .in('status', ['sent', 'delivered'])
      .gte('created_at', oneHourAgo)
      .limit(1)

    if (existingNotification && existingNotification.length > 0) {
      return jsonResponse({ message: 'Patient already notified recently' }, 200, origin)
    }

    // Get patient details only after the doctor and queue authorization checks pass.
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, push_subscription')
      .eq('user_id', patientToNotify.patient_id)
      .single()

    if (!profile) {
      return jsonResponse({ error: 'Patient profile not found' }, 404, origin)
    }

    const message = `Hi ${profile.full_name}, your turn is coming up! You are ${threshold} patients away. Token #${patientToNotify.token_number}. Please be ready.`
    const results: { sms?: boolean; push?: boolean } = {}

    // Replace these placeholders with provider-backed delivery before production use.
    if (smsEnabled && profile.phone) {
      try {
        console.log('SMS provider integration is not configured for this function.')
        await supabase.from('notification_logs').insert({
          appointment_id: patientToNotify.id,
          patient_id: patientToNotify.patient_id,
          notification_type: 'sms',
          message,
          status: 'failed',
          error_message: 'SMS provider integration is not configured',
        })
        results.sms = false
      } catch (error) {
        console.error('SMS notification logging error:', error)
        results.sms = false
      }
    }

    if (pushEnabled && profile.push_subscription) {
      try {
        console.log('Push provider integration is not configured for this function.')
        await supabase.from('notification_logs').insert({
          appointment_id: patientToNotify.id,
          patient_id: patientToNotify.patient_id,
          notification_type: 'push',
          message,
          status: 'failed',
          error_message: 'Push provider integration is not configured',
        })
        results.push = false
      } catch (error) {
        console.error('Push notification logging error:', error)
        results.push = false
      }
    }

    return jsonResponse({
      success: true,
      message: 'Notification check completed',
      patient_token: patientToNotify.token_number,
      results,
    }, 200, origin)
  } catch (error) {
    console.error('Notification function error:', error)
    return jsonResponse({ error: 'An unexpected error occurred' }, 500, origin)
  }
})
