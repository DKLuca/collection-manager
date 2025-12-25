import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, MapPin, ArrowUpDown, ChevronUp, ChevronDown, Plus, X, Trash2, Hash, Disc, Star, StickyNote } from 'lucide-react'; // Aggiunta icona StickyNote
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// 1. TIPO AGGIORNATO
type Vinyl = {
  id: number;
  title: string;
  artist: string;
  year: number;
  location: string;
  cost: number;
  speed: string;
  rating: number;
  notes: string; // <--- NUOVO CAMPO
};

type SortConfig = {
  key: keyof Vinyl | null;
  direction: 'asc' | 'desc';
};

export default function Vinyls() {
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 2. STATO FORM AGGIORNATO
  const [newItem, setNewItem] = useState({
    id: 0,
    artist: '',
    title: '',
    year: '',
    location: '',
    cost: '',
    speed: '',
    rating: '',
    notes: '' // <--- NUOVO CAMPO
  });

  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchVinyls = async () => {
      const { data, error } = await supabase
        .from('vinyls')
        .select('*');
      
      if (error) console.error("Errore download:", error);
      else if (data) setVinyls(data);
    };
    fetchVinyls();
  }, []);

  const openNewVinylModal = () => {
    let nextId = 1; 
    if (vinyls.length > 0) {
      const currentIds = vinyls.map(v => v.id);
      const maxId = Math.max(...currentIds);
      nextId = maxId + 1;
    }

    setNewItem({
        id: nextId, 
        artist: '',
        title: '',
        year: '',
        location: '',
        cost: '',
        speed: '',
        rating: '',
        notes: '' // Reset note
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newVinylPayload = {
        id: newItem.id,
        title: newItem.title,
        artist: newItem.artist,
        location: newItem.location,
        speed: newItem.speed,
        notes: newItem.notes, // <--- INVIO NOTE A SUPABASE
        year: parseInt(newItem.year) || null,
        cost: parseFloat(newItem.cost) || 0,
        rating: parseInt(newItem.rating) || null
    };

    const { data, error } = await supabase
        .from('vinyls')
        .insert([newVinylPayload])
        .select();

    if (error) {
        console.error("Errore salvataggio:", error);
        alert("Errore: " + error.message);
    } else if (data) {
        setVinyls([...vinyls, data[0]]);
        setIsModalOpen(false);
    }
  };

  const handleDelete = async (idToDelete: number) => {
    if (!confirm("Vuoi eliminare questo vinile?")) return;

    const { error } = await supabase
        .from('vinyls')
        .delete()
        .eq('id', idToDelete);

    if (!error) {
        setVinyls(vinyls.filter(v => v.id !== idToDelete));
    }
  };

  const handleSort = (key: keyof Vinyl) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFiltered = useMemo(() => {
    const items = vinyls.filter((v) => 
      v.artist.toLowerCase().includes(search.toLowerCase()) || 
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.notes && v.notes.toLowerCase().includes(search.toLowerCase())) // Cerca anche nelle note!
    );

    if (sortConfig.key) {
      items.sort((a, b) => {
        // @ts-ignore
        const aValue = a[sortConfig.key];
        // @ts-ignore
        const bValue = b[sortConfig.key];
        if (aValue === undefined || bValue === undefined) return 0;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [vinyls, search, sortConfig]);

  const totalValue = sortedAndFiltered.reduce((acc, v) => acc + (v.cost || 0), 0);

  const SortIcon = ({ column }: { column: any }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 relative">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-violet-950 dark:text-violet-100">Collezione Vinili</h1>
          <p className="text-slate-500">I tuoi dischi preferiti.</p>
        </div>
        
        <div className="flex gap-3">
            <div className="bg-violet-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-violet-200 dark:shadow-none flex items-center gap-4">
                <div className="text-sm opacity-80 uppercase tracking-wider font-semibold hidden md:block">Valore</div>
                <div className="text-2xl font-bold">{totalValue.toFixed(2)}€</div>
            </div>
            <Button onClick={openNewVinylModal} size="lg" className="rounded-2xl gap-2 shadow-lg bg-slate-900 text-white hover:bg-slate-800">
                <Plus size={20} />
                <span className="hidden md:inline">Aggiungi Vinile</span>
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 flex flex-row items-center gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cerca per artista, album o note..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-violet-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                  <TableHead><Button variant="ghost" onClick={() => handleSort('artist')} className="p-0 font-bold hover:bg-transparent">Artista <SortIcon column="artist" /></Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => handleSort('title')} className="p-0 font-bold hover:bg-transparent">Album <SortIcon column="title" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" onClick={() => handleSort('year')} className="p-0 font-bold hover:bg-transparent mx-auto">Anno <SortIcon column="year" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" onClick={() => handleSort('rating')} className="p-0 font-bold hover:bg-transparent mx-auto">Voto <SortIcon column="rating" /></Button></TableHead>
                  <TableHead className="text-center">Posizione</TableHead>
                  <TableHead>Note</TableHead> {/* Intestazione Note */}
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFiltered.map((vinyl) => (
                  <TableRow key={vinyl.id} className="hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors border-slate-50 dark:border-slate-800 group">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">{vinyl.artist}</TableCell>
                    <TableCell className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Disc className="h-4 w-4 text-violet-400" />
                        {vinyl.title}
                    </TableCell>
                    <TableCell className="text-center text-slate-500">{vinyl.year}</TableCell>
                    
                    <TableCell className="text-center">
                        {vinyl.rating > 0 && (
                            <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold border border-yellow-100">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {vinyl.rating}
                            </div>
                        )}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {vinyl.location}
                      </div>
                    </TableCell>

                    {/* COLONNA NOTE */}
                    <TableCell className="max-w-[200px] truncate text-slate-500 text-sm italic">
                        {vinyl.notes}
                    </TableCell>

                    <TableCell className="text-right font-bold text-violet-600 dark:text-violet-400">{vinyl.cost.toFixed(2)}€</TableCell>
                    <TableCell>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(vinyl.id)}>
                            <Trash2 size={16} />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold">Nuovo Vinile</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="id" className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                            <Hash className="h-3 w-3" /> ID Sequenziale
                        </Label>
                        <Input id="id" value={newItem.id} disabled className="bg-slate-100 text-slate-500 font-mono font-bold"/>
                    </div>

                    <div className="space-y-2">
                        <Label>Artista</Label>
                        <Input required placeholder="Es. Pink Floyd" value={newItem.artist} onChange={(e) => setNewItem({...newItem, artist: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Titolo Album</Label>
                        <Input required placeholder="Es. The Dark Side of the Moon" value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Anno</Label>
                            <Input type="number" placeholder="1973" value={newItem.year} onChange={(e) => setNewItem({...newItem, year: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Giri</Label>
                            <Input placeholder="33, 45..." value={newItem.speed} onChange={(e) => setNewItem({...newItem, speed: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>Voto (1-10)</Label>
                            <Input 
                                type="number" 
                                min="1" 
                                max="10" 
                                placeholder="8" 
                                value={newItem.rating} 
                                onChange={(e) => setNewItem({...newItem, rating: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Posizione</Label>
                            <Input placeholder="Scaffale B" value={newItem.location} onChange={(e) => setNewItem({...newItem, location: e.target.value})} />
                        </div>
                    </div>

                    {/* CAMPO NOTE NEL FORM */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <StickyNote className="h-3 w-3" /> Note
                        </Label>
                        <Input 
                            placeholder="Es. Edizione limitata, copertina rovinata..." 
                            value={newItem.notes} 
                            onChange={(e) => setNewItem({...newItem, notes: e.target.value})} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Costo (€)</Label>
                        <Input type="number" step="0.01" placeholder="0.00" value={newItem.cost} onChange={(e) => setNewItem({...newItem, cost: e.target.value})} />
                    </div>

                    <div className="flex gap-3 pt-4 mt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                        <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">Salva</Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}