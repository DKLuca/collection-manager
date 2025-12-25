import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, MapPin, ArrowUpDown, ChevronUp, ChevronDown, Plus, X, Trash2, Hash, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox'; // Se hai shadcn checkbox, altrimenti useremo input html standard

// 1. Aggiorniamo il TIPO con i nuovi campi del DB
type Book = {
  id: number;
  title: string;
  author: string;
  location: string;
  cost: number;
  is_series: boolean;      // NUOVO
  series_name: string;     // NUOVO
  series_number: number;   // NUOVO
};

type SortConfig = {
  key: keyof Book | null;
  direction: 'asc' | 'desc';
};

export default function OwnedBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 2. Aggiorniamo lo STATO del form
  const [newItem, setNewItem] = useState({
    id: 0,
    author: '',
    title: '',
    location: '',
    cost: '',
    isSeries: false,       // Checkbox stato
    seriesName: '',        // Nome serie
    seriesNumber: ''       // Numero (stringa per l'input)
  });

  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from('owned_books')
        .select('*');
      
      if (error) console.error("Errore download:", error);
      else if (data) setBooks(data);
    };
    fetchBooks();
  }, []);

  const openNewBookModal = () => {
    let nextId = 1; 
    if (books.length > 0) {
      const currentIds = books.map(book => book.id);
      const maxId = Math.max(...currentIds);
      nextId = maxId + 1;
    }

    setNewItem({
        id: nextId, 
        author: '',
        title: '',
        location: '',
        cost: '',
        isSeries: false,
        seriesName: '',
        seriesNumber: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepariamo i dati per Supabase
    const newBookPayload = {
        id: newItem.id,
        title: newItem.title,
        author: newItem.author,
        location: newItem.location,
        cost: parseFloat(newItem.cost) || 0,
        // Logica condizionale: salviamo la serie solo se la checkbox è true
        is_series: newItem.isSeries,
        series_name: newItem.isSeries ? newItem.seriesName : null,
        series_number: newItem.isSeries ? parseInt(newItem.seriesNumber) : null
    };

    const { data, error } = await supabase
        .from('owned_books')
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

  const handleDelete = async (idToDelete: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo libro?")) return;

    const { error } = await supabase
        .from('owned_books')
        .delete()
        .eq('id', idToDelete);

    if (error) {
        console.error("Errore eliminazione:", error);
    } else {
        setBooks(books.filter(book => book.id !== idToDelete));
    }
  };

  const handleSort = (key: keyof Book) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFiltered = useMemo(() => {
    const items = books.filter((book) => 
      book.author.toLowerCase().includes(search.toLowerCase()) || 
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      (book.series_name && book.series_name.toLowerCase().includes(search.toLowerCase())) // Cerca anche nella serie!
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

  const totalValue = sortedAndFiltered.reduce((acc, book) => acc + (book.cost || 0), 0);

  const SortIcon = ({ column }: { column: any }) => {
    if (sortConfig.key !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Libri Posseduti</h1>
          <p className="text-slate-500">L'inventario cloud della tua libreria.</p>
        </div>
        
        <div className="flex gap-3">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none flex items-center gap-4">
                <div className="text-sm opacity-80 uppercase tracking-wider font-semibold hidden md:block">Valore</div>
                <div className="text-2xl font-bold">{totalValue.toFixed(2)}€</div>
            </div>
            <Button onClick={openNewBookModal} size="lg" className="rounded-2xl gap-2 shadow-lg">
                <Plus size={20} />
                <span className="hidden md:inline">Aggiungi Libro</span>
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 flex flex-row items-center gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cerca per autore, titolo o serie..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-emerald-500"
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
                  <TableHead className="text-center"><Button variant="ghost" onClick={() => handleSort('location')} className="p-0 font-bold hover:bg-transparent mx-auto">Posizione <SortIcon column="location" /></Button></TableHead>
                  <TableHead className="text-right"><Button variant="ghost" onClick={() => handleSort('cost')} className="p-0 font-bold hover:bg-transparent ml-auto">Costo (€) <SortIcon column="cost" /></Button></TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFiltered.map((book) => (
                  <TableRow key={book.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors border-slate-50 dark:border-slate-800 group">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">{book.author}</TableCell>
                    
                    {/* 3. MODIFICA VISUALE: Mostriamo il titolo E la serie se c'è */}
                    <TableCell>
                        <div className="text-slate-900 dark:text-slate-100 font-medium">{book.title}</div>
                        {book.is_series && book.series_name && (
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                <BookOpen size={12} />
                                {book.series_name} #{book.series_number}
                            </div>
                        )}
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {book.location}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{book.cost.toFixed(2)}€</TableCell>
                    <TableCell>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(book.id)}>
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
                    <h2 className="text-xl font-bold">Nuovo Libro</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="id" className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                            <Hash className="h-3 w-3" /> ID Sequenziale
                        </Label>
                        <Input 
                            id="id" 
                            value={newItem.id} 
                            disabled 
                            className="bg-slate-100 text-slate-500 font-mono font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="author">Autore</Label>
                        <Input id="author" required placeholder="Es. J.K. Rowling" value={newItem.author} onChange={(e) => setNewItem({...newItem, author: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">Titolo</Label>
                        <Input id="title" required placeholder="Es. La pietra filosofale" value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} />
                    </div>

                    {/* 4. NUOVA SEZIONE CHECKBOX SERIE */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg space-y-4 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center space-x-2">
                            <input 
                                type="checkbox" 
                                id="isSeries"
                                checked={newItem.isSeries}
                                onChange={(e) => setNewItem({...newItem, isSeries: e.target.checked})}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                            />
                            <Label htmlFor="isSeries" className="font-medium cursor-pointer">Fa parte di una saga/serie?</Label>
                        </div>

                        {/* Appare solo se spuntato */}
                        {newItem.isSeries && (
                            <div className="grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="col-span-3 space-y-1.5">
                                    <Label htmlFor="seriesName" className="text-xs">Nome Saga</Label>
                                    <Input 
                                        id="seriesName" 
                                        placeholder="Es. Harry Potter" 
                                        value={newItem.seriesName} 
                                        onChange={(e) => setNewItem({...newItem, seriesName: e.target.value})} 
                                        required={newItem.isSeries} // Diventa obbligatorio solo se spuntato
                                    />
                                </div>
                                <div className="col-span-1 space-y-1.5">
                                    <Label htmlFor="seriesNumber" className="text-xs">Vol. N°</Label>
                                    <Input 
                                        id="seriesNumber" 
                                        type="number" 
                                        placeholder="1" 
                                        value={newItem.seriesNumber} 
                                        onChange={(e) => setNewItem({...newItem, seriesNumber: e.target.value})} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Posizione</Label>
                            <Input id="location" placeholder="Es. A1" value={newItem.location} onChange={(e) => setNewItem({...newItem, location: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Costo (€)</Label>
                            <Input id="cost" type="number" step="0.01" placeholder="0.00" value={newItem.cost} onChange={(e) => setNewItem({...newItem, cost: e.target.value})} />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4 mt-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">Salva</Button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}