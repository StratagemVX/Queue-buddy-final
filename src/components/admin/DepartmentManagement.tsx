import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { demoDepartments, getDoctorsByDepartment } from '@/lib/demoData';

interface Department {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  doctor_count?: number;
}

const ICONS = [
  'Stethoscope', 'Heart', 'Brain', 'Bone', 'Eye', 'Baby', 
  'Syringe', 'Pill', 'Activity', 'Thermometer', 'Microscope', 'Building2'
];

interface DepartmentManagementProps {
  useDemoMode?: boolean;
}

export function DepartmentManagement({ useDemoMode = false }: DepartmentManagementProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Building2',
  });

  useEffect(() => {
    if (useDemoMode) {
      loadDemoData();
    } else {
      fetchDepartments();
    }
  }, [useDemoMode]);

  function loadDemoData() {
    const depts: Department[] = demoDepartments.map(d => ({
      ...d,
      doctor_count: getDoctorsByDepartment(d.id).length
    }));
    setDepartments(depts);
    setLoading(false);
  }

  async function fetchDepartments() {
    const { data: depts } = await supabase
      .from('departments')
      .select('*')
      .order('name') as { data: Department[] | null };
    
    if (depts) {
      // Get doctor count for each department
      const withCounts = await Promise.all(
        depts.map(async (dept) => {
          const { count } = await supabase
            .from('doctors')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);
          return { ...dept, doctor_count: count || 0 };
        })
      );
      setDepartments(withCounts);
    }
    setLoading(false);
  }

  function resetForm() {
    setFormData({ name: '', description: '', icon: 'Building2' });
    setEditingDept(null);
  }

  function openEditDialog(dept: Department) {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      icon: dept.icon || 'Building2',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const deptData = {
      name: formData.name,
      description: formData.description || null,
      icon: formData.icon,
    };

    if (editingDept) {
      const { error } = await supabase
        .from('departments')
        .update(deptData as any)
        .eq('id', editingDept.id);
      
      if (error) {
        toast({ title: 'Error updating department', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Department updated successfully' });
        setDialogOpen(false);
        resetForm();
        fetchDepartments();
      }
    } else {
      const { error } = await supabase
        .from('departments')
        .insert(deptData as any);
      
      if (error) {
        toast({ title: 'Error adding department', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Department added successfully' });
        setDialogOpen(false);
        resetForm();
        fetchDepartments();
      }
    }
  }

  async function deleteDepartment(id: string, doctorCount: number) {
    if (doctorCount > 0) {
      toast({ 
        title: 'Cannot delete department', 
        description: `This department has ${doctorCount} doctor(s). Reassign or remove them first.`,
        variant: 'destructive' 
      });
      return;
    }
    
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting department', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Department deleted' });
      fetchDepartments();
    }
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
        <CardTitle>Manage Departments</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDept ? 'Edit Department' : 'Add New Department'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={formData.icon === icon ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDept ? 'Update' : 'Add'} Department
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
              <TableHead>Description</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Doctors</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {dept.name}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{dept.description || '-'}</TableCell>
                <TableCell>{dept.icon || 'Building2'}</TableCell>
                <TableCell>{dept.doctor_count}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(dept)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteDepartment(dept.id, dept.doctor_count || 0)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {departments.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">No departments found. Add your first department.</p>
        )}
      </CardContent>
    </Card>
  );
}
