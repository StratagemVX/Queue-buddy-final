import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Bell, Clock, Building, Mail, Phone } from 'lucide-react';
import { demoSettings } from '@/lib/demoData';

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

interface SystemSettingsProps {
  useDemoMode?: boolean;
}

export function SystemSettings({ useDemoMode = false }: SystemSettingsProps) {
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (useDemoMode) {
      loadDemoSettings();
    } else {
      fetchSettings();
    }
  }, [useDemoMode]);

  function loadDemoSettings() {
    const settingsMap: Record<string, Setting> = {};
    demoSettings.forEach((s) => {
      settingsMap[s.key] = s;
    });
    setSettings(settingsMap);
    setLoading(false);
  }

  async function fetchSettings() {
    const { data } = await supabase
      .from('system_settings')
      .select('*') as { data: Setting[] | null };
    
    if (data) {
      const settingsMap: Record<string, Setting> = {};
      data.forEach((s) => {
        settingsMap[s.key] = s;
      });
      setSettings(settingsMap);
    }
    setLoading(false);
  }

  function getValue(key: string, defaultValue: string = ''): string {
    return settings[key]?.value || defaultValue;
  }

  function updateValue(key: string, value: string) {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  }

  async function saveSettings() {
    setSaving(true);
    
    const updates = Object.values(settings).map((setting: Setting) => ({
      id: setting.id,
      key: setting.key,
      value: setting.value,
      description: setting.description,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('system_settings')
      .upsert(updates as any, { onConflict: 'key' });

    if (error) {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved successfully' });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clinic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" /> Clinic Information
          </CardTitle>
          <CardDescription>Basic information about your clinic/hospital</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clinic_name">Clinic Name</Label>
              <Input
                id="clinic_name"
                value={getValue('clinic_name', 'MediQueue Hospital')}
                onChange={(e) => updateValue('clinic_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic_phone">Contact Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clinic_phone"
                  className="pl-9"
                  value={getValue('clinic_phone')}
                  onChange={(e) => updateValue('clinic_phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic_email">Contact Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clinic_email"
                  type="email"
                  className="pl-9"
                  value={getValue('clinic_email')}
                  onChange={(e) => updateValue('clinic_email', e.target.value)}
                  placeholder="contact@clinic.com"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Working Hours
          </CardTitle>
          <CardDescription>Set the default working hours for the clinic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="working_hours_start">Opening Time</Label>
              <Input
                id="working_hours_start"
                type="time"
                value={getValue('working_hours_start', '09:00')}
                onChange={(e) => updateValue('working_hours_start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="working_hours_end">Closing Time</Label>
              <Input
                id="working_hours_end"
                type="time"
                value={getValue('working_hours_end', '18:00')}
                onChange={(e) => updateValue('working_hours_end', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_duration">Default Consultation Duration (minutes)</Label>
            <Input
              id="default_duration"
              type="number"
              className="max-w-xs"
              value={getValue('default_consultation_duration', '15')}
              onChange={(e) => updateValue('default_consultation_duration', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Used for wait time estimation when a doctor's average is not available
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notification Settings
          </CardTitle>
          <CardDescription>Configure how patients are notified about their appointments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send SMS alerts to patients when their turn is approaching
              </p>
            </div>
            <Switch
              checked={getValue('sms_enabled', 'true') === 'true'}
              onCheckedChange={(checked) => updateValue('sms_enabled', checked ? 'true' : 'false')}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Send browser push notifications to patients
              </p>
            </div>
            <Switch
              checked={getValue('push_enabled', 'true') === 'true'}
              onCheckedChange={(checked) => updateValue('push_enabled', checked ? 'true' : 'false')}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="notification_threshold">Notification Threshold</Label>
            <Input
              id="notification_threshold"
              type="number"
              className="max-w-xs"
              value={getValue('notification_threshold', '3')}
              onChange={(e) => updateValue('notification_threshold', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Number of patients ahead when notification is sent (e.g., 3 = notify when 3 patients away)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
