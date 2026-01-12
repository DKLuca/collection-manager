import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, MapPin, ArrowUpDown, ChevronUp, ChevronDown, Plus, X, Trash2, Hash, Music, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

type CD = {
  id: number;
  title: string;
  artist: string;
  year: number;
  location: string;
  cost: number;
};

type SortConfig = {
  key: keyof CD | null;
  direction: 'asc' | 'desc';
};

export default function CDs() {
  const [cds, setCds] = useState<CD[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [newItem, setNewItem] = useState({
    id: 0,
    artist: '',
    title: '',
    year: '',
    location: '',
    cost: ''
  });

  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchCDs = async () => {
      const { data, error } = await supabase.from('cds').select('*');
      if (error) console.error("Errore download:", error);
      else if (data) setCds(data);
    };
    fetchCDs();
  }, []);

  const openNewCDModal = () => {
    setEditingId(null);
    let nextId = 1; 
    if (cds.length > 0) {
      const currentIds = cds.map(cd => cd.id);
      const maxId = Math.max(...currentIds);
      nextId = maxId + 1;
    }

    setNewItem({
        id: nextId, 
        artist: '',
        title: '',
        year: '',
        location: '',
        cost: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cd: CD) => {
    setEditingId(cd.id);
    setNewItem({
        id: cd.id,
        artist: cd.artist,
        title: cd.title,
        year: cd.year ? cd.year.toString() : '',
        location: cd.location || '',
        cost: cd.cost.toString()
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
        title: newItem.title,
        artist: newItem.artist,
        location: newItem.location,
        year: parseInt(newItem.year) || null,
        cost: parseFloat(newItem.cost) || 0
    };

    if (editingId) {
        // UPDATE
        const { data, error } = await supabase.from('cds').update(payload).eq('id', editingId).select();
        if (error) alert(error.message);
        else if (data) {
            setCds(cds.map(c => c.id === editingId ? data[0] : c));
            setIsModalOpen(false);
            setEditingId(null);
        }
    } else {
        // INSERT
        const insertPayload = { ...payload, id: newItem.id };
        const { data, error } = await supabase.from('cds').insert([insertPayload]).select();
        if (error) alert(error.message);
        else if (data) {
            setCds([...cds, data[0]]);
            setIsModalOpen(false);
        }
    }
  };

  const handleDelete = async (idToDelete: number) => {
    if (!confirm("Vuoi eliminare questo CD?")) return;
    const { error } = await supabase.from('cds').delete().eq('id', idToDelete);
    if (!error) setCds(cds.filter(c => c.id !== idToDelete));
  };

  const handleSort = (key: keyof CD) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedAndFiltered = useMemo(() => {
    const items = cds.filter((c) => 
      c.artist.toLowerCase().includes(search.toLowerCase()) || 
      c.title.toLowerCase().includes(search.toLowerCase())
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
  }, [cds, search, sortConfig]);

  const totalValue = sortedAndFiltered.reduce((acc, c) => acc + (c.cost || 0), 0);
  const SortIcon = ({ column }: { column: any }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pink-950 dark:text-pink-100">Collezione CD</h1>
          <p className="text-slate-500">I tuoi Compact Disc.</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-pink-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-pink-200 dark:shadow-none flex items-center gap-4">
                <div className="text-sm opacity-80 uppercase tracking-wider font-semibold hidden md:block">Valore</div>
                <div className="text-2xl font-bold">{totalValue.toFixed(2)}€</div>
            </div>
            <Button onClick={openNewCDModal} size="lg" className="rounded-2xl gap-2 shadow-lg bg-slate-900 text-white hover:bg-slate-800">
                <Plus size={20} />
                <span className="hidden md:inline">Aggiungi CD</span>
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 flex flex-row items-center gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Cerca per artista o album..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-pink-500"/>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                  <TableHead><Button variant="ghost" onClick={() => handleSort('artist')} className="p-0 font-bold hover:bg-transparent">Artista <SortIcon column="artist" /></Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => handleSort('title')} className="p-0 font-bold hover:bg-transparent">Titolo <SortIcon column="title" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" onClick={() => handleSort('year')} className="p-0 font-bold hover:bg-transparent mx-auto">Anno <SortIcon column="year" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" onClick={() => handleSort('location')} className="p-0 font-bold hover:bg-transparent mx-auto">Posizione <SortIcon column="location" /></Button></TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFiltered.map((cd) => (
                  <TableRow key={cd.id} className="hover:bg-pink-50/30 dark:hover:bg-pink-900/10 transition-colors border-slate-50 dark:border-slate-800 group">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">{cd.artist}</TableCell>
                    <TableCell className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Music className="h-4 w-4 text-pink-400" />
                        {cd.title}
                    </TableCell>
                    <TableCell className="text-center text-slate-500">{cd.year}</TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {cd.location}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-pink-600 dark:text-pink-400">{cd.cost.toFixed(2)}€</TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => openEditModal(cd)}>
                                <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(cd.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-bold">{editingId ? "Modifica CD" : "Nuovo CD"}</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="id" className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                            <Hash className="h-3 w-3" /> ID {editingId ? "(Non modificabile)" : "Sequenziale"}
                        </Label>
                        <Input id="id" value={newItem.id} disabled className="bg-slate-100 text-slate-500 font-mono font-bold"/>
                    </div>
                    <div className="space-y-2">
                        <Label>Artista</Label>
                        <Input required placeholder="Es. Queen" value={newItem.artist} onChange={(e) => setNewItem({...newItem, artist: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label>Titolo Album</Label>
                        <Input required placeholder="Es. Greatest Hits" value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Anno</Label>
                            <Input type="number" placeholder="1981" value={newItem.year} onChange={(e) => setNewItem({...newItem, year: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Posizione</Label>
                            <Input placeholder="Scaffale C" value={newItem.location} onChange={(e) => setNewItem({...newItem, location: e.target.value})} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Costo (€)</Label>
                        <Input type="number" step="0.01" placeholder="0.00" value={newItem.cost} onChange={(e) => setNewItem({...newItem, cost: e.target.value})} />
                    </div>
                    <div className="flex gap-3 pt-4 mt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                        <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white">Conferma</Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}