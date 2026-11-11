import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, User } from 'lucide-react';
import { demoDoctors, demoDepartments, getDepartmentById } from '@/lib/demoData';

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  qualification: string | null;
  experience_years: number | null;
  department_id: string;
  is_available: boolean | null;
  available_from: string | null;
  available_to: string | null;
  max_patients_per_day: number | null;
  consultation_fee: number | null;
  avg_consultation_duration: number | null;
  departments?: { name: string } | null;
}

interface Department {
  id: string;
  name: string;
}

interface DoctorManagementProps {
  useDemoMode?: boolean;
}

export function DoctorManagement({ useDemoMode = false }: DoctorManagementProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    qualification: '',
    experience_years: '',
    department_id: '',
    is_available: true,
    available_from: '09:00',
    available_to: '17:00',
    max_patients_per_day: '30',
    consultation_fee: '',
    avg_consultation_duration: '15',
  });

  useEffect(() => {
    if (useDemoMode) {
      loadDemoData();
    } else {
      fetchDoctors();
      fetchDepartments();
    }
  }, [useDemoMode]);

  function loadDemoData() {
    const mappedDoctors: Doctor[] = demoDoctors.map(d => ({
      ...d,
      departments: getDepartmentById(d.department_id) ? { name: getDepartmentById(d.department_id)!.name } : null
    }));
    setDoctors(mappedDoctors);
    setDepartments(demoDepartments.map(d => ({ id: d.id, name: d.name })));
    setLoading(false);
  }

  async function fetchDoctors() {
    const { data } = await supabase
      .from('doctors')
      .select('*, departments(name)')
      .order('name');
    if (data) setDoctors(data);
    setLoading(false);
  }

  async function fetchDepartments() {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .order('name');
    if (data) setDepartments(data);
  }

  function resetForm() {
    setFormData({
      name: '',
      specialization: '',
      qualification: '',
      experience_years: '',
      department_id: '',
      is_available: true,
      available_from: '09:00',
      available_to: '17:00',
      max_patients_per_day: '30',
      consultation_fee: '',
      avg_consultation_duration: '15',
    });
    setEditingDoctor(null);
  }

  function openEditDialog(doctor: Doctor) {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization || '',
      qualification: doctor.qualification || '',
      experience_years: doctor.experience_years?.toString() || '',
      department_id: doctor.department_id,
      is_available: doctor.is_available ?? true,
      available_from: doctor.available_from || '09:00',
      available_to: doctor.available_to || '17:00',
      max_patients_per_day: doctor.max_patients_per_day?.toString() || '30',
      consultation_fee: doctor.consultation_fee?.toString() || '',
      avg_consultation_duration: doctor.avg_consultation_duration?.toString() || '15',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const doctorData = {
      name: formData.name,
      specialization: formData.specialization || null,
      qualification: formData.qualification || null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      department_id: formData.department_id,
      is_available: formData.is_available,
      available_from: formData.available_from,
      available_to: formData.available_to,
      max_patients_per_day: formData.max_patients_per_day ? parseInt(formData.max_patients_per_day) : null,
      consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null,
      avg_consultation_duration: formData.avg_consultation_duration ? parseInt(formData.avg_consultation_duration) : 15,
    };

    if (editingDoctor) {
      const { error } = await supabase
        .from('doctors')
        .update(doctorData)
        .eq('id', editingDoctor.id);
      
      if (error) {
        toast({ title: 'Error updating doctor', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Doctor updated successfully' });
        setDialogOpen(false);
        resetForm();
        fetchDoctors();
      }
    } else {
      const { error } = await supabase
        .from('doctors')
        .insert(doctorData);
      
      if (error) {
        toast({ title: 'Error adding doctor', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Doctor added successfully' });
        setDialogOpen(false);
        resetForm();
        fetchDoctors();
      }
    }
  }

  async function deleteDoctor(id: string) {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting doctor', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Doctor deleted' });
      fetchDoctors();
    }
  }

  async function toggleAvailability(doctor: Doctor) {
    const { error } = await supabase
      .from('doctors')
      .update({ is_available: !doctor.is_available })
      .eq('id', doctor.id);
    
    if (!error) fetchDoctors();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Doctors</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">Consultation Fee</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from">Available From</Label>
                  <Input
                    id="from"
                    type="time"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">Available To</Label>
                  <Input
                    id="to"
                    type="time"
                    value={formData.available_to}
                    onChange={(e) => setFormData({ ...formData, available_to: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Max Patients/Day</Label>
                  <Input
                    id="max"
                    type="number"
                    value={formData.max_patients_per_day}
                    onChange={(e) => setFormData({ ...formData, max_patients_per_day: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Avg. Consultation (mins)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.avg_consultation_duration}
                    onChange={(e) => setFormData({ ...formData, avg_consultation_duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDoctor ? 'Update' : 'Add'} Doctor
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Avg. Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {doctor.name}
                  </div>
                </TableCell>
                <TableCell>{doctor.departments?.name}</TableCell>
                <TableCell>{doctor.specialization || '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {doctor.available_from} - {doctor.available_to}
                </TableCell>
                <TableCell>{doctor.avg_consultation_duration || 15} mins</TableCell>
                <TableCell>
                  <Badge
                    variant={doctor.is_available ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleAvailability(doctor)}
                  >
                    {doctor.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(doctor)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteDoctor(doctor.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {doctors.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">No doctors found. Add your first doctor.</p>
        )}
      </CardContent>
    </Card>
  );
}
