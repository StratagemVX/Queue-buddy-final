import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WaitTimeResult {
  estimatedMinutes: number;
  queuePosition: number;
  patientsAhead: number;
}

/**
 * Calculate estimated wait time based on:
 * 1. Doctor's average consultation duration
 * 2. Current queue position
 * 3. Number of patients ahead
 */
export function useWaitTime(
  doctorId: string | undefined, 
  tokenNumber: number | undefined
): WaitTimeResult | null {
  const [result, setResult] = useState<WaitTimeResult | null>(null);

  useEffect(() => {
    if (!doctorId || !tokenNumber) {
      setResult(null);
      return;
    }

    calculateWaitTime();
    
    // Subscribe to queue changes
    const channel = supabase
      .channel(`wait-time-${doctorId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'appointments',
        filter: `doctor_id=eq.${doctorId}`,
      }, () => {
        calculateWaitTime();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId, tokenNumber]);

  async function calculateWaitTime() {
    if (!doctorId || !tokenNumber) return;

    const today = new Date().toISOString().split('T')[0];

    // Get doctor's average consultation duration
    const { data: doctor } = await supabase
      .from('doctors')
      .select('avg_consultation_duration')
      .eq('id', doctorId)
      .single();

    const avgDuration = doctor?.avg_consultation_duration || 15;

    // Get all waiting patients ahead of this token
    const { data: queue } = await supabase
      .from('appointments')
      .select('token_number, status')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', today)
      .in('status', ['waiting', 'in_progress'])
      .lt('token_number', tokenNumber)
      .order('token_number');

    const patientsAhead = queue?.length || 0;
    const queuePosition = patientsAhead + 1;
    
    // If someone is in progress, they count as partially done
    const inProgress = queue?.find(q => q.status === 'in_progress');
    const waitingAhead = inProgress ? patientsAhead - 0.5 : patientsAhead;
    
    const estimatedMinutes = Math.round(waitingAhead * avgDuration);

    setResult({
      estimatedMinutes,
      queuePosition,
      patientsAhead,
    });
  }

  return result;
}

/**
 * Format minutes into a human-readable string
 */
export function formatWaitTime(minutes: number): string {
  if (minutes <= 0) return 'Your turn!';
  if (minutes < 60) return `~${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `~${hours} hr`;
  }
  return `~${hours} hr ${remainingMinutes} min`;
}

/**
 * Get wait time color based on estimated minutes
 */
export function getWaitTimeColor(minutes: number): string {
  if (minutes <= 10) return 'text-green-600';
  if (minutes <= 30) return 'text-yellow-600';
  if (minutes <= 60) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Calculate batch wait times for multiple appointments
 */
export async function calculateBatchWaitTimes(
  doctorId: string,
  appointments: { token_number: number; id: string }[]
): Promise<Map<string, number>> {
  const today = new Date().toISOString().split('T')[0];
  const waitTimes = new Map<string, number>();

  // Get doctor's average duration
  const { data: doctor } = await supabase
    .from('doctors')
    .select('avg_consultation_duration')
    .eq('id', doctorId)
    .single();

  const avgDuration = doctor?.avg_consultation_duration || 15;

  // Sort appointments by token number
  const sorted = [...appointments].sort((a, b) => a.token_number - b.token_number);

  // Calculate wait time for each
  sorted.forEach((apt, index) => {
    waitTimes.set(apt.id, index * avgDuration);
  });

  return waitTimes;
}
