import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, ArrowUpDown, ChevronUp, ChevronDown, Plus, X, Trash2, Hash, Star, BookOpen, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// TIPO DATI LIBRO LETTO
type ReadBook = {
  id: number;
  title: string;
  author: string;
  read_year: number; // Su Supabase la colonna è 'read_year'
  pages: number;
  rating: number;
  notes: string;
};

type SortConfig = {
  key: keyof ReadBook | null;
  direction: 'asc' | 'desc';
};

export default function ReadBooks() {
  const [books, setBooks] = useState<ReadBook[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newItem, setNewItem] = useState({
    id: 0,
    author: '',
    title: '',
    read_year: new Date().getFullYear().toString(),
    pages: '',
    rating: '',
    notes: ''
  });

  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  // 1. Caricamento
  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('read_books')
        .select('*');
      
      if (error) console.error("Errore download:", error);
      else if (data) setBooks(data);
    };
    fetchBooks();
  }, []);

  // 2. ID Sequenziale
  const openNewReadBookModal = () => {
    let nextId = 1; 
    if (books.length > 0) {
      const currentIds = books.map(b => b.id);
      const maxId = Math.max(...currentIds);
      nextId = maxId + 1;
    }

    setNewItem({
        id: nextId, 
        author: '',
        title: '',
        read_year: new Date().getFullYear().toString(),
        pages: '',
        rating: '',
        notes: ''
    });
    setIsModalOpen(true);
  };

  // 3. Salvataggio
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBookPayload = {
        id: newItem.id,
        title: newItem.title,
        author: newItem.author,
        read_year: parseInt(newItem.read_year) || null,
        pages: parseInt(newItem.pages) || 0,
        rating: parseInt(newItem.rating) || null,
        notes: newItem.notes
    };

    const { data, error } = await supabase
        .from('read_books')
        .insert([newBookPayload])
        .select();

    if (error) {
        console.error("Errore salvataggio:", error);
        alert("Errore: " + error.message);
    } else if (data) {
        setBooks([...books, data[0]]);
        setIsModalOpen(false);
    }
  };

  // 4. Eliminazione
  const handleDelete = async (idToDelete: number) => {
    if (!confirm("Vuoi rimuovere questo libro dallo storico?")) return;

    const { error } = await supabase
        .from('read_books')
        .delete()
        .eq('id', idToDelete);

    if (!error) {
        setBooks(books.filter(b => b.id !== idToDelete));
    }
  };

  // Calcolo Pagine totali (per l'header)
  const pagineTotali = books.reduce((acc, b) => acc + (b.pages || 0), 0);

  // Ordinamento
  const handleSort = (key: keyof ReadBook) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFiltered = useMemo(() => {
    const items = books.filter((b) => 
      b.author.toLowerCase().includes(search.toLowerCase()) || 
      b.title.toLowerCase().includes(search.toLowerCase())
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
  }, [books, search, sortConfig]);

  const SortIcon = ({ column }: { column: any }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 relative">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-amber-950 dark:text-amber-100">Libri Letti</h1>
          <p className="text-slate-500">Lo storico delle tue letture.</p>
        </div>
        
        <div className="flex gap-3">
            <div className="bg-amber-500 text-white px-6 py-3 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-none flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                    <p className="text-xs font-semibold tracking-wider opacity-90">PAGINE TOTALI</p>
                    <p className="text-2xl font-bold">{pagineTotali}</p>
                </div>
            </div>
            
            <Button onClick={openNewReadBookModal} size="lg" className="rounded-2xl gap-2 shadow-lg bg-slate-900 text-white hover:bg-slate-800">
                <Plus size={20} />
                <span className="hidden md:inline">Registra Lettura</span>
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 flex flex-row items-center gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cerca per autore o titolo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-amber-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                  <TableHead><Button variant="ghost" onClick={() => handleSort('author')} className="p-0 font-bold hover:bg-transparent">Autore <SortIcon column="author" /></Button></TableHead>
                  <TableHead><Button variant="ghost" onClick={() => handleSort('title')} className="p-0 font-bold hover:bg-transparent">Titolo <SortIcon column="title" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" onClick={() => handleSort('read_year')} className="p-0 font-bold hover:bg-transparent mx-auto">Anno <SortIcon column="read_year" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" onClick={() => handleSort('pages')} className="p-0 font-bold hover:bg-transparent mx-auto">Pagine <SortIcon column="pages" /></Button></TableHead>
                  <TableHead className="text-center"><Button variant="ghost" onClick={() => handleSort('rating')} className="p-0 font-bold hover:bg-transparent mx-auto">Voto <SortIcon column="rating" /></Button></TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFiltered.map((book) => (
                  <TableRow key={book.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors border-slate-50 dark:border-slate-800 group">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">{book.author}</TableCell>
                    <TableCell className="text-slate-900 dark:text-slate-100 font-semibold">{book.title}</TableCell>
                    <TableCell className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            {book.read_year}
                        </span>
                    </TableCell>
                    <TableCell className="text-center text-slate-600 dark:text-slate-400">{book.pages}</TableCell>
                    
                    {/* Visualizzazione Voto */}
                    <TableCell className="text-center">
                        {book.rating > 0 && (
                            <div className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold border border-yellow-100 mx-auto">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {book.rating}
                            </div>
                        )}
                    </TableCell>

                    <TableCell className="max-w-[200px] truncate text-slate-500 text-sm italic">
                        {book.notes}
                    </TableCell>

                    <TableCell>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(book.id)}>
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
                    <h2 className="text-xl font-bold">Registra Lettura</h2>
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
                        <Label>Autore</Label>
                        <Input required value={newItem.author} onChange={e => setNewItem({...newItem, author: e.target.value})} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Titolo</Label>
                        <Input required value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Anno Lettura</Label>
                            <Input type="number" value={newItem.read_year} onChange={e => setNewItem({...newItem, read_year: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>Numero Pagine</Label>
                            <Input type="number" required value={newItem.pages} onChange={e => setNewItem({...newItem, pages: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Voto (1-10)</Label>
                        <Input type="number" min="1" max="10" value={newItem.rating} onChange={e => setNewItem({...newItem, rating: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <StickyNote className="h-3 w-3" /> Note personali
                        </Label>
                        <Input value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} placeholder="Opinioni, voto..." />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                        <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">Salva</Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}