import { supabase } from '@/integrations/supabase/client';

interface NotificationResult {
  success: boolean;
  message: string;
  patient_token?: number;
}

/**
 * Trigger notification check for a specific doctor's queue
 * This calls the edge function to send notifications to patients who are close in queue
 */
export async function triggerNotificationCheck(doctorId: string): Promise<NotificationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('notify-patients', {
      body: { doctor_id: doctorId, action: 'check_queue' },
    });

    if (error) {
      console.error('Notification error:', error);
      return { success: false, message: error.message };
    }

    return data as NotificationResult;
  } catch (error) {
    console.error('Failed to trigger notifications:', error);
    return { success: false, message: 'Failed to trigger notifications' };
  }
}

/**
 * Subscribe patient for push notifications
 */
export async function subscribePushNotifications(userId: string): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }

    // In a real implementation, you would:
    // 1. Register a service worker
    // 2. Get push subscription from the browser
    // 3. Save the subscription to the database

    // For now, just mark that they've subscribed
    await supabase
      .from('profiles')
      .update({ push_subscription: { subscribed: true, timestamp: new Date().toISOString() } })
      .eq('user_id', userId);

    return true;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return false;
  }
}

/**
 * Update patient phone number for SMS notifications
 */
export async function updatePhoneNumber(userId: string, phone: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ phone })
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Failed to update phone number:', error);
    return false;
  }
}

/**
 * Check if a patient should receive a notification
 * Returns true if the patient is at the notification threshold position
 */
export async function checkNotificationStatus(
  appointmentId: string,
  doctorId: string
): Promise<{ shouldNotify: boolean; position: number; threshold: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get notification threshold from settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'notification_threshold')
      .single();

    const threshold = parseInt(settings?.value || '3');

    // Get current queue position
    const { data: appointment } = await supabase
      .from('appointments')
      .select('token_number')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return { shouldNotify: false, position: 0, threshold };
    }

    // Count patients ahead
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .in('status', ['waiting', 'in_progress'])
      .lt('token_number', appointment.token_number);

    const position = (count || 0) + 1;

    return {
      shouldNotify: position === threshold,
      position,
      threshold,
    };
  } catch (error) {
    console.error('Failed to check notification status:', error);
    return { shouldNotify: false, position: 0, threshold: 3 };
  }
}
