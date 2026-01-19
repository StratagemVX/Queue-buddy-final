// Supabase Edge Function for sending notifications to patients
// Deploy with: supabase functions deploy notify-patients

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  doctor_id: string
  action: 'check_queue' | 'send_notification'
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { doctor_id, action }: NotificationPayload = await req.json()

    // Get notification threshold from settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'notification_threshold')
      .single()

    const threshold = parseInt(settings?.value || '3')

    // Get SMS enabled setting
    const { data: smsSettings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'sms_enabled')
      .single()

    const smsEnabled = smsSettings?.value === 'true'

    // Get push enabled setting
    const { data: pushSettings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'push_enabled')
      .single()

    const pushEnabled = pushSettings?.value === 'true'

    if (!smsEnabled && !pushEnabled) {
      return new Response(
        JSON.stringify({ message: 'Notifications are disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current queue for the doctor
    const today = new Date().toISOString().split('T')[0]
    
    const { data: queue } = await supabase
      .from('appointments')
      .select('id, token_number, patient_id')
      .eq('doctor_id', doctor_id)
      .eq('appointment_date', today)
      .eq('status', 'waiting')
      .order('token_number')

    if (!queue || queue.length < threshold) {
      return new Response(
        JSON.stringify({ message: 'Not enough patients in queue', queue_length: queue?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the patient at the threshold position
    const patientToNotify = queue[threshold - 1]

    // Check if we already notified this patient recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: existingNotification } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('appointment_id', patientToNotify.id)
      .in('status', ['sent', 'delivered'])
      .gte('created_at', oneHourAgo)
      .limit(1)

    if (existingNotification && existingNotification.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Patient already notified recently' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get patient details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, push_subscription')
      .eq('user_id', patientToNotify.patient_id)
      .single()

    if (!profile) {
      return new Response(
        JSON.stringify({ message: 'Patient profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const message = `Hi ${profile.full_name}, your turn is coming up! You are ${threshold} patients away. Token #${patientToNotify.token_number}. Please be ready.`
    const results: { sms?: boolean; push?: boolean } = {}

    // Send SMS notification
    if (smsEnabled && profile.phone) {
      try {
        // Here you would integrate with your SMS provider (Twilio, etc.)
        // For now, we'll just log it and mark as sent
        console.log(`SMS to ${profile.phone}: ${message}`)
        
        // Log the notification
        await supabase.from('notification_logs').insert({
          appointment_id: patientToNotify.id,
          patient_id: patientToNotify.patient_id,
          notification_type: 'sms',
          message,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        
        results.sms = true
      } catch (error) {
        console.error('SMS error:', error)
        await supabase.from('notification_logs').insert({
          appointment_id: patientToNotify.id,
          patient_id: patientToNotify.patient_id,
          notification_type: 'sms',
          message,
          status: 'failed',
          error_message: error.message,
        })
        results.sms = false
      }
    }

    // Send Push notification
    if (pushEnabled && profile.push_subscription) {
      try {
        // Here you would send web push notification
        // For now, we'll just log it
        console.log(`Push notification to patient ${patientToNotify.patient_id}: ${message}`)
        
        await supabase.from('notification_logs').insert({
          appointment_id: patientToNotify.id,
          patient_id: patientToNotify.patient_id,
          notification_type: 'push',
          message,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        
        results.push = true
      } catch (error) {
        console.error('Push error:', error)
        await supabase.from('notification_logs').insert({
          appointment_id: patientToNotify.id,
          patient_id: patientToNotify.patient_id,
          notification_type: 'push',
          message,
          status: 'failed',
          error_message: error.message,
        })
        results.push = false
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent',
        patient_token: patientToNotify.token_number,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
