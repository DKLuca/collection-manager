import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, MapPin, ArrowUpDown, ChevronUp, ChevronDown, Plus, X, Trash2, Hash, BookOpen, Pencil, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { searchGoogleBooks, type BookResult } from '@/lib/googleBooks';
import { findOpenLibraryCover } from '@/lib/openLibrary';

type Book = {
  id: number;
  title: string;
  author: string;
  location: string;
  cost: number;
  is_series: boolean;
  series_name: string;
  series_number: number;
  // *** NUOVI CAMPI ***
  cover_url?: string;
  isbn?: string;
  publisher?: string;
  page_count?: number;
  published_date?: string;
  description?: string;
  google_id?: string;
};

type SortConfig = {
  key: keyof Book | null;
  direction: 'asc' | 'desc';
};

export default function OwnedBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // STATI PER GOOGLE BOOKS
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [posterBook, setPosterBook] = useState<Book | null>(null);
  const [showCoverPreview, setShowCoverPreview] = useState(false); // Per il popup full screen dal form
  const [manualCoverMode, setManualCoverMode] = useState(false); // Per mostrare l'input manuale

  const [newItem, setNewItem] = useState({
    id: 0,
    author: '',
    title: '',
    location: '',
    cost: '',
    isSeries: false,
    seriesName: '',
    seriesNumber: '',
    // *** NUOVI CAMPI NEL FORM ***
    cover_url: '',
    isbn: '',
    publisher: '',
    page_count: '',
    published_date: '',
    description: '',
    google_id: ''
  });

  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase.from('owned_books').select('*');
      if (error) console.error("Errore download:", error);
      else if (data) setBooks(data);
    };
    fetchBooks();
  }, []);

  // --- LOGICA RICERCA GOOGLE BOOKS ---
  const handleBookSearch = async () => {
    if (!bookQuery) return;
    setIsSearching(true);
    setShowResults(true);
    setIsSearchFocused(true);
    
    const results = await searchGoogleBooks(bookQuery);
    setBookResults(results);
    setIsSearching(false);
  };

const selectBook = async (book: BookResult) => {
    // 1. UI Feedback immediato (chiudiamo la ricerca)
    setShowResults(false);
    setBookQuery('');
    setIsSearchFocused(false);

    // 2. Prepariamo la cover di base (Google)
    let bestCover = book.imageLinks?.thumbnail || '';
    
    // 3. TENTATIVO HD CON OPEN LIBRARY
    // Se abbiamo un ISBN, proviamo a cercare la cover migliore
    if (book.isbn) {
        // Mettiamo un piccolo feedback o semplicemente aspettiamo
        const hdCover = await findOpenLibraryCover(book.isbn);
        if (hdCover) {
            bestCover = hdCover;
        }
    }

    setManualCoverMode(false); // Disabilita l'input manuale se selezioniamo da Google

    // 4. Compiliamo il form
    setNewItem({
        ...newItem,
        title: book.title,
        author: book.authors.join(', '),
        publisher: book.publisher || '',
        published_date: book.publishedDate || '',
        page_count: book.pageCount ? book.pageCount.toString() : '',
        description: book.description || '',
        isbn: book.isbn || '',
        google_id: book.id,
        
        // Qui finisce la copertina vincente (Google o Open Library)
        cover_url: bestCover, 
        
        cost: book.price ? book.price.toString() : '', 
        location: newItem.location
    });
  };
  // APRE MODALE PER NUOVO INSERIMENTO
  const openNewBookModal = () => {
    setEditingId(null);
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
        seriesNumber: '',
        cover_url: '',
        isbn: '',
        publisher: '',
        page_count: '',
        published_date: '',
        description: '',
        google_id: ''
    });
    // Reset stati ricerca
    setBookQuery('');
    setBookResults([]);
    setIsSearchFocused(false);
    
    setIsModalOpen(true);
  };

  // APRE MODALE PER MODIFICA
  const openEditModal = (book: Book) => {
    setEditingId(book.id);
    setNewItem({
        id: book.id,
        author: book.author,
        title: book.title,
        location: book.location || '',
        cost: book.cost.toString(),
        isSeries: book.is_series,
        seriesName: book.series_name || '',
        seriesNumber: book.series_number ? book.series_number.toString() : '',
        cover_url: book.cover_url || '',
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        page_count: book.page_count ? book.page_count.toString() : '',
        published_date: book.published_date || '',
        description: book.description || '',
        google_id: book.google_id || ''
    });
    // In modifica nascondiamo la ricerca
    setBookQuery('');
    setIsSearchFocused(false);
    
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
        title: newItem.title,
        author: newItem.author,
        location: newItem.location,
        cost: parseFloat(newItem.cost) || 0,
        is_series: newItem.isSeries,
        series_name: newItem.isSeries ? newItem.seriesName : null,
        series_number: newItem.isSeries ? parseInt(newItem.seriesNumber) : null,
        // *** SALVATAGGIO NUOVI CAMPI ***
        cover_url: newItem.cover_url || null,
        isbn: newItem.isbn || null,
        publisher: newItem.publisher || null,
        page_count: parseInt(newItem.page_count) || null,
        published_date: newItem.published_date || null,
        description: newItem.description || null,
        google_id: newItem.google_id || null
    };

    if (editingId) {
        // UPDATE
        const { data, error } = await supabase
            .from('owned_books')
            .update(payload)
            .eq('id', editingId)
            .select();

        if (error) alert("Errore modifica: " + error.message);
        else if (data) {
            setBooks(books.map(b => b.id === editingId ? data[0] : b));
            setIsModalOpen(false);
            setEditingId(null);
        }
    } else {
        // INSERT
        const insertPayload = { ...payload, id: newItem.id };
        const { data, error } = await supabase
            .from('owned_books')
            .insert([insertPayload])
            .select();

        if (error) alert("Errore inserimento: " + error.message);
        else if (data) {
            setBooks([...books, data[0]]);
            setIsModalOpen(false);
        }
    }
  };

  const handleDelete = async (idToDelete: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo libro?")) return;
    const { error } = await supabase.from('owned_books').delete().eq('id', idToDelete);
    if (!error) {
        setBooks(books.filter(book => book.id !== idToDelete));
    }
  };

  const handleSort = (key: keyof Book) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedAndFiltered = useMemo(() => {
    const items = books.filter((book) => 
      book.author.toLowerCase().includes(search.toLowerCase()) || 
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      (book.series_name && book.series_name.toLowerCase().includes(search.toLowerCase()))
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
          <h1 className="text-3xl font-bold tracking-tight text-emerald-950 dark:text-emerald-100">Libri Posseduti</h1>
          <p className="text-slate-500">L'inventario cloud della tua libreria.</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none flex items-center gap-4">
                <div className="text-sm opacity-80 uppercase tracking-wider font-semibold hidden md:block">Valore</div>
                <div className="text-2xl font-bold">{totalValue.toFixed(2)}€</div>
            </div>
            <Button onClick={openNewBookModal} size="lg" className="rounded-2xl gap-2 shadow-lg bg-slate-900 text-white hover:bg-slate-800">
                <Plus size={20} />
                <span className="hidden md:inline">Aggiungi Libro</span>
            </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 flex flex-row items-center gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Cerca per autore, titolo o serie..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-emerald-500"/>
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
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFiltered.map((book) => (
                  <TableRow key={book.id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors border-slate-50 dark:border-slate-800 group">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">{book.author}</TableCell>
                    <TableCell className="flex items-center gap-3">
                        {/* Miniatura copertina se c'è */}
                        {book.cover_url ? (
                            <img src={book.cover_url} alt="" className="h-8 w-8 object-cover rounded shadow-sm border border-slate-200" />
                        ) : (
                            <div className="h-8 w-8 bg-slate-100 rounded flex items-center justify-center text-slate-300"><BookOpen size={14}/></div>
                        )}
                        <div>
                            <div className="text-slate-900 dark:text-slate-100 font-medium cursor-pointer hover:underline hover:text-emerald-600 transition-colors" onClick={() => setPosterBook(book)} >
                              {book.title}
                        </div>
                            {book.is_series && book.series_name && (
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                                    <BookOpen size={12} />
                                    {book.series_name} #{book.series_number}
                                </div>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {book.location}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{book.cost.toFixed(2)}€</TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => openEditModal(book)}>
                                <Pencil size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(book.id)}>
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

      {/* MODALE DI INSERIMENTO / MODIFICA WIDESCREEN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* CONTAINER ALLARGATO (max-w-5xl invece di md) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 max-h-[95vh] flex flex-col">
                
                {/* HEADER FISSO */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <h2 className="text-xl font-bold">{editingId ? "Modifica Libro" : "Nuovo Libro"}</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* BODY SCROLLABILE (Se lo schermo è basso) */}
                <div className="overflow-y-auto p-6">
                    
                    {/* RICERCA GOOGLE (Solo in nuovo inserimento) */}
                    {!editingId && (
                        <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-lg">
                            <Label className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 block">
                                1. Cerca su Google Books (Opzionale)
                            </Label>
                            <div className="flex gap-2 relative">
                                <Input 
                                    placeholder="Scansiona ISBN o digita Titolo..." 
                                    value={bookQuery}
                                    onChange={(e) => setBookQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBookSearch()}
                                    className="bg-white dark:bg-slate-950"
                                />
                                <Button onClick={handleBookSearch} disabled={isSearching} variant="secondary">
                                    {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                                </Button>
                                {(bookQuery) && (
                                    <Button variant="ghost" onClick={() => { setBookQuery(''); setBookResults([]); }}>
                                    <X size={16} />
                                    </Button>
                                )}
                                
                                {/* RISULTATI DROPDOWN */}
                                {showResults && bookResults.length > 0 && (
                                    <div className="absolute top-11 left-0 right-0 z-20 max-h-60 overflow-y-auto space-y-2 border rounded-md p-2 bg-white dark:bg-slate-950 shadow-xl">
                                        {bookResults.map((res) => (
                                            <div key={res.id} onClick={() => selectBook(res)} className="flex items-center gap-3 p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer rounded-lg group">
                                                <div className="h-10 w-7 bg-slate-200 rounded overflow-hidden shrink-0">
                                                    {res.imageLinks?.thumbnail && <img src={res.imageLinks.thumbnail} alt="" className="h-full w-full object-cover" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate text-slate-700 dark:text-slate-200">{res.title}</p>
                                                    <p className="text-xs text-slate-500 truncate">{res.authors.join(', ')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="flex flex-col lg:flex-row gap-8">
                        
                        {/* COLONNA SINISTRA: COPERTINA (Fissa larghezza) */}
                        <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
                            <Label className="text-xs font-bold uppercase text-slate-500">Copertina</Label>
                            
                            <div 
                                className="aspect-[2/3] bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer relative group transition-all hover:border-emerald-500 shadow-sm"
                                onClick={() => newItem.cover_url && setShowCoverPreview(true)}
                            >
                                {newItem.cover_url ? (
                                    <>
                                        <img src={newItem.cover_url} alt="Cover" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-xs px-2 py-1 rounded">Zoom</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4 text-slate-400">
                                        <ImageIcon className="mx-auto h-10 w-10 mb-2 opacity-50" />
                                        <span className="text-xs">No Image</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="checkbox" id="manualCover" checked={manualCoverMode} 
                                        onChange={(e) => setManualCoverMode(e.target.checked)} 
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                                    />
                                    <Label htmlFor="manualCover" className="text-xs cursor-pointer select-none">Link manuale</Label>
                                </div>
                                {(manualCoverMode || !newItem.cover_url) && (
                                    <Input 
                                        placeholder="https://..." 
                                        value={newItem.cover_url} 
                                        onChange={(e) => setNewItem({...newItem, cover_url: e.target.value})} 
                                        className="text-xs h-8"
                                    />
                                )}
                            </div>
                        </div>

                        {/* COLONNA DESTRA: DATI (Griglia Compressa) */}
                        <div className="flex-1 space-y-5">
                            <div className="flex justify-between items-start">
                                <Label className="text-xs font-bold uppercase text-slate-500">2. Dettagli Libro</Label>
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono text-slate-500">
                                    <Hash className="h-3 w-3" /> ID: {newItem.id}
                                </div>
                            </div>

                            {/* RIGA 1: Titolo e Autore */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="title" className="text-xs">Titolo</Label>
                                    <Input id="title" required value={newItem.title} onChange={(e) => setNewItem({...newItem, title: e.target.value})} className="font-semibold"/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="author" className="text-xs">Autore</Label>
                                    <Input id="author" required value={newItem.author} onChange={(e) => setNewItem({...newItem, author: e.target.value})} />
                                </div>
                            </div>

                            {/* RIGA 2: Editore, Pagine, Anno */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="publisher" className="text-xs">Editore</Label>
                                    <Input id="publisher" value={newItem.publisher} onChange={(e) => setNewItem({...newItem, publisher: e.target.value})} className="h-9 text-sm"/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="pages" className="text-xs">Pagine</Label>
                                    <Input id="pages" type="number" value={newItem.page_count} onChange={(e) => setNewItem({...newItem, page_count: e.target.value})} className="h-9 text-sm"/>
                                </div>
                                <div className="space-y-1.5 col-span-2 md:col-span-1">
                                    <Label htmlFor="pubDate" className="text-xs">Data Pubb.</Label>
                                    <Input id="pubDate" placeholder="YYYY" value={newItem.published_date} onChange={(e) => setNewItem({...newItem, published_date: e.target.value})} className="h-9 text-sm"/>
                                </div>
                            </div>

                            {/* RIGA 3: Serie (Riquadro) */}
                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                <div className="flex items-center space-x-2 mb-3">
                                    <input type="checkbox" id="isSeries" checked={newItem.isSeries} onChange={(e) => setNewItem({...newItem, isSeries: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"/>
                                    <Label htmlFor="isSeries" className="font-medium cursor-pointer text-sm text-emerald-800 dark:text-emerald-200">Fa parte di una serie</Label>
                                </div>
                                {newItem.isSeries && (
                                    <div className="flex gap-3 animate-in fade-in">
                                        <div className="flex-1 space-y-1">
                                            <Input id="seriesName" placeholder="Nome Saga" className="h-8 bg-white dark:bg-slate-900" value={newItem.seriesName} onChange={(e) => setNewItem({...newItem, seriesName: e.target.value})} />
                                        </div>
                                        <div className="w-20 space-y-1">
                                            <Input id="seriesNumber" type="number" placeholder="#" className="h-8 bg-white dark:bg-slate-900 text-center" value={newItem.seriesNumber} onChange={(e) => setNewItem({...newItem, seriesNumber: e.target.value})} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGA 4: Costo, Posizione, Note */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="location" className="text-xs">Posizione</Label>
                                    <Input id="location" value={newItem.location} onChange={(e) => setNewItem({...newItem, location: e.target.value})} className="h-9"/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="cost" className="text-xs">Costo (€)</Label>
                                    <Input id="cost" type="number" step="0.01" value={newItem.cost} onChange={(e) => setNewItem({...newItem, cost: e.target.value})} className="h-9"/>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor="desc" className="text-xs">Note</Label>
                                    <Input id="desc" value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} className="h-9"/>
                                </div>
                            </div>

                        </div>
                    </form>
                </div>

                {/* FOOTER AZIONI */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                    <Button type="submit" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]">Salva Libro</Button>
                </div>
            </div>
        </div>
      )}
      {posterBook && (
        <BookPoster book={posterBook} onClose={() => setPosterBook(null)} />
      )}
      {showCoverPreview && (
        <BookPoster 
            // Dobbiamo convertire "newItem" (che ha stringhe) in un oggetto Book compatibile
            book={{
                ...newItem,
                cost: parseFloat(newItem.cost) || 0,
                is_series: newItem.isSeries,
                series_name: newItem.seriesName,
                series_number: parseInt(newItem.seriesNumber) || 0,
                page_count: parseInt(newItem.page_count) || 0,
                published_date: newItem.published_date
            }} 
            onClose={() => setShowCoverPreview(false)} 
        />
      )}
    </div>
  );
}
function BookPoster({ book, onClose }: { book: any, onClose: () => void }) {
  if (!book) return null;
  const year = book.published_date ? book.published_date.substring(0, 4) : '';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
        
        {/* POSTER: Aggiunto max-h-[90vh] e overflow-y-auto */}
        <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#EBE9E1] text-[#333] shadow-2xl rounded-sm animate-in zoom-in-95 duration-300 flex flex-col"
        >
            {/* Tasto Chiudi (Sticky per rimanere visibile se scorri) */}
            <button onClick={onClose} className="absolute top-2 right-2 z-30 bg-black/10 hover:bg-black/20 text-white rounded-full p-1 transition-colors">
                <X size={20} />
            </button>

            {/* IMMAGINE (Altezza limitata per lasciare spazio al testo) */}
            <div className="w-full bg-zinc-200 relative overflow-hidden shrink-0 h-64 sm:h-80">
                {book.cover_url ? (
                    <>
                        <div 
                            className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110" 
                            style={{ backgroundImage: `url(${book.cover_url})` }} 
                        />
                        <img src={book.cover_url} alt={book.title} className="relative w-full h-full object-contain z-10 shadow-lg p-4" />
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-600 gap-4">
                        <BookOpen size={60} />
                        <span className="text-xs uppercase tracking-widest">No Cover</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/5 pointer-events-none mix-blend-multiply z-20"></div>
            </div>

            {/* TESTO */}
            <div className="p-6 pb-10 font-sans relative flex-1">
                <div className="flex flex-col gap-1 mb-4 border-b border-zinc-300 pb-3">
                    <h2 className="text-3xl font-bold uppercase tracking-tighter leading-none text-black">
                        {book.title}
                    </h2>
                    <div className="flex justify-between items-baseline mt-1">
                        <span className="text-lg font-light text-zinc-600 truncate mr-2">
                            {book.author}
                        </span>
                        {year && (
                            <span className="text-xl font-bold text-zinc-400 font-mono whitespace-nowrap">
                                {year}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-xs uppercase tracking-widest text-zinc-600 font-semibold">
                    <div>
                        <span className="block text-[10px] text-zinc-400 mb-0.5">Publisher</span>
                        <span className="text-black truncate block">{book.publisher || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-zinc-400 mb-0.5">Pages</span>
                        <span className="text-black">{book.page_count || 'N/A'}</span>
                    </div>

                    {book.is_series && (
                         <div className="col-span-2">
                            <span className="block text-[10px] text-emerald-600/70 mb-0.5">Series Collection</span>
                            <span className="text-emerald-900 bg-emerald-100/50 px-2 py-1 rounded inline-block">
                                {book.series_name} <span className="text-emerald-900/50">#{book.series_number}</span>
                            </span>
                        </div>
                    )}
                    
                    {book.description && (
                        <div className="col-span-2 mt-1 normal-case tracking-normal border-t border-zinc-200 pt-3">
                            <p className="font-serif italic text-zinc-500 leading-relaxed text-sm line-clamp-6">
                                "{book.description}"
                            </p>
                        </div>
                    )}

                     <div className="col-span-2 mt-1 flex justify-between items-end border-t border-zinc-200 pt-3">
                        <div>
                            <span className="block text-[10px] text-zinc-400">Location</span>
                            <span className="text-black bg-zinc-200 px-1.5 py-0.5 rounded">{book.location || 'Unknown'}</span>
                        </div>
                         {book.isbn && (
                            <div className="text-right">
                                <span className="block text-[8px] text-zinc-400">ISBN</span>
                                <span className="font-mono text-[10px] tracking-normal">{book.isbn}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="absolute bottom-1 left-0 right-0 text-center text-[8px] text-zinc-400 uppercase tracking-[0.2em]">
                    Personal Library • Archive
                </div>
            </div>
        </div>
    </div>
  );
}