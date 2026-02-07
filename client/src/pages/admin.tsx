import { useAuth } from "@/hooks/use-auth";
import { Link, Route, Switch, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { LayoutShell } from "@/components/layout-shell";
import { 
  Loader2, Plus, Trash2, Edit, Calendar, MapPin, Trophy, Users 
} from "lucide-react";
import { useTournaments, useCreateTournament, useDeleteTournament, useCategories, useCreateCategory } from "@/hooks/use-tournaments";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTournamentSchema, insertCategorySchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

// Admin Dashboard Router
export default function AdminPage() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  
  if (!user || (user.role !== "admin" && user.role !== "organizer")) {
    return <div className="p-10 text-center">Access Denied</div>;
  }

  return (
    <LayoutShell>
      <div className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/admin" component={AdminTournamentsList} />
          <Route path="/admin/tournaments/:id" component={AdminTournamentDetails} />
        </Switch>
      </div>
    </LayoutShell>
  );
}

// 1. Tournament List View
function AdminTournamentsList() {
  const { user } = useAuth();
  const { data: tournaments, isLoading } = useTournaments();
  const deleteTournament = useDeleteTournament();
  const [open, setOpen] = useState(false);

  // Filter only if organizer? (Backend should handle this generally, but frontend filter for UX)
  const myTournaments = tournaments?.filter(t => user?.role === 'admin' || t.organizerId === user?.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold font-display text-slate-900">Dashboard</h1>
           <p className="text-slate-500">Manage your tournaments and matches.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-lg shadow-primary/20"><Plus className="w-4 h-4" /> Create Tournament</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Tournament</DialogTitle>
            </DialogHeader>
            <CreateTournamentForm onSuccess={() => setOpen(false)} organizerId={user!.id} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Loader2 className="animate-spin mx-auto" />
      ) : (
        <div className="grid gap-6">
          {myTournaments?.map(t => (
            <div key={t.id} className="flex items-center justify-between p-6 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <Link href={`/admin/tournaments/${t.id}`}>
                    <h3 className="text-lg font-bold text-slate-900 hover:text-primary cursor-pointer">{t.name}</h3>
                  </Link>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(t.startDate), "MMM d, yyyy")}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t.location}</span>
                    <Badge variant="outline" className="text-xs">{t.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/tournaments/${t.id}`}>
                   <Button variant="outline" size="sm">Manage</Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm("Are you sure? This cannot be undone.")) {
                      deleteTournament.mutate(t.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {myTournaments?.length === 0 && (
            <div className="text-center py-12 bg-slate-50 border border-dashed rounded-xl">
              <p className="text-muted-foreground">You haven't created any tournaments yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateTournamentForm({ onSuccess, organizerId }: { onSuccess: () => void, organizerId: number }) {
  const createTournament = useCreateTournament();
  const form = useForm({
    resolver: zodResolver(insertTournamentSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      organizerId,
      status: "draft" as const,
      courts: 1
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createTournament.mutate(data, { onSuccess }))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name</FormLabel>
              <FormControl><Input placeholder="Summer Beach Open 2024" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl><Input placeholder="Copacabana Beach, Rio" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl><Input type="date" value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={e => field.onChange(new Date(e.target.value))} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl><Input type="date" value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={e => field.onChange(new Date(e.target.value))} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={createTournament.isPending}>
          {createTournament.isPending ? "Creating..." : "Create Tournament"}
        </Button>
      </form>
    </Form>
  );
}

// 2. Tournament Details Admin
function AdminTournamentDetails() {
  const [, params] = useRoute("/admin/tournaments/:id");
  const id = Number(params?.id);
  const { data: tournament, isLoading } = useTournaments(); // Would ideally use useTournament(id)
  const currentTournament = tournament?.find(t => t.id === id);
  
  const { data: categories, isLoading: loadingCats } = useCategories(id);
  const [catOpen, setCatOpen] = useState(false);

  if (isLoading) return <Loader2 className="animate-spin" />;
  if (!currentTournament) return <div>Not found</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b">
         <div>
            <Link href="/admin" className="text-sm text-muted-foreground hover:underline mb-2 block">← Back to Dashboard</Link>
            <h1 className="text-3xl font-bold font-display">{currentTournament.name}</h1>
         </div>
         <Badge>{currentTournament.status}</Badge>
      </div>

      {/* Categories Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Manage divisions (e.g. Men's Open, Mixed)</CardDescription>
          </div>
          <Dialog open={catOpen} onOpenChange={setCatOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
               <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
               <CreateCategoryForm tournamentId={id} onSuccess={() => setCatOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loadingCats ? <Loader2 className="animate-spin" /> : (
            <div className="grid gap-4">
              {categories?.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-4 border rounded-lg bg-slate-50">
                  <div className="font-medium">{cat.name} <span className="text-muted-foreground text-sm font-normal">({cat.gender})</span></div>
                  <div className="text-sm text-muted-foreground">{cat.minTeams} - {cat.maxTeams} Teams</div>
                </div>
              ))}
              {categories?.length === 0 && <p className="text-muted-foreground italic">No categories yet.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for further team/match management */}
      <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl text-blue-800">
        <h3 className="font-bold mb-2">Next Steps</h3>
        <p className="text-sm">To manage teams and matches, please select a category from the list above (Feature to be implemented in next iteration).</p>
      </div>
    </div>
  );
}

function CreateCategoryForm({ tournamentId, onSuccess }: { tournamentId: number, onSuccess: () => void }) {
  const createCategory = useCreateCategory();
  const form = useForm({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      tournamentId,
      name: "",
      gender: "male" as const,
      minTeams: 4,
      maxTeams: 16
    }
  });

  return (
    <Form {...form}>
       <form onSubmit={form.handleSubmit(data => createCategory.mutate(data, { onSuccess }))} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category Name</FormLabel>
                <FormControl><Input placeholder="Open Pro" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={createCategory.isPending}>
            {createCategory.isPending ? "Adding..." : "Add Category"}
          </Button>
       </form>
    </Form>
  )
}
