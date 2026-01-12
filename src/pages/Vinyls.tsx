import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Search, MapPin, ArrowUpDown, ChevronUp, ChevronDown, Plus, X, Trash2, Hash, Disc, Star, StickyNote, Pencil, ChevronLeft, ChevronRight, Loader2, Download, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { searchDiscogs, type DiscogsResult } from '@/lib/discogs';
import { findITunesCover } from '@/lib/itunes';

import CoverUpdater from '@/components/CoverUpdater';

type Vinyl = {
  id: number;
  title: string;
  artist: string;
  year: number;
  location: string;
  cost: number;
  speed: string;
  rating: number;
  notes: string;
  cover_url?: string;
  label?: string;
  genre?: string;
  discogs_id?: number;
};

type SortConfig = {
  key: keyof Vinyl | null;
  direction: 'asc' | 'desc';
};

export default function Vinyls() {
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // *** NUOVO: Stati per l'impaginazione ***
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(50); // Default 50
  const [currentPage, setCurrentPage] = useState(1);

  const [isSearchFocused, setIsSearchFocused] = useState(false); // collassare l'input manuale

  const [newItem, setNewItem] = useState({
    id: 0,
    artist: '',
    title: '',
    year: '',
    location: '',
    cost: '',
    speed: '',
    rating: '',
    notes: '',
    cover_url: '',
    label: '',
    genre: '',
    discogs_id: 0
  });

  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const [discogsQuery, setDiscogsQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiscogsResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [posterVinyl, setPosterVinyl] = useState<Vinyl | null>(null);

  useEffect(() => {
    const fetchVinyls = async () => {
      const { data, error } = await supabase.from('vinyls').select('*');
      if (error) console.error("Errore download:", error);
      else if (data) setVinyls(data);
    };
    fetchVinyls();
  }, []);

  // *** NUOVO: Reset della pagina a 1 quando si cerca, si ordina o si cambia il numero di elementi ***
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortConfig, itemsPerPage]);

  const handleDiscogsSearch = async () => {
    if (!discogsQuery) return;
    setIsSearching(true);
    setShowResults(true);
    const results = await searchDiscogs(discogsQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

const selectDiscogsItem = async (item: DiscogsResult) => {
    // 1. Reset UI immediato (così l'utente vede subito il form aprirsi)
    setShowResults(false);
    setDiscogsQuery('');
    setIsSearchFocused(false);

    // 2. Prepariamo i dati base da Discogs
    const [artistPart, titlePart] = item.title.split(' - ').map(s => s.trim());
    const finalArtist = artistPart || item.title;
    const finalTitle = titlePart || '';

    // 3. Impostiamo uno stato temporaneo con la foto di Discogs (nel caso iTunes fallisca)
    // Nota: 'thumb' è piccola, 'cover_image' spesso è protetta.
    let bestCover = item.cover_image || item.thumb || '';

    // 4. TENTATIVO AUTOMATICO ITUNES (Il "Ben Dodson" trick)
    try {
        const iTunesCover = await findITunesCover(finalArtist, finalTitle);
        if (iTunesCover) {
            console.log("Trovata cover HD da iTunes!", iTunesCover);
            bestCover = iTunesCover;
        }
    } catch (e) {
        console.log("Nessuna cover iTunes trovata, uso Discogs");
    }

    // 5. Compiliamo il form finale
    setNewItem({
        ...newItem,
        artist: finalArtist,
        title: finalTitle,
        year: item.year || '',
        // Qui finisce la copertina migliore trovata (HD di iTunes o standard di Discogs)
        cover_url: bestCover, 
        label: item.label ? item.label[0] : '',
        genre: item.genre ? item.genre[0] : '',
        discogs_id: item.id,
        notes: item.year ? `Stampa del ${item.year}` : ''
    });
  };

  const openNewVinylModal = () => {
    setEditingId(null);
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
      notes: '',
      cover_url: '',
      label: '',
      genre: '',
      discogs_id: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vinyl: Vinyl) => {
    setEditingId(vinyl.id);
    setNewItem({
      id: vinyl.id,
      artist: vinyl.artist,
      title: vinyl.title,
      year: vinyl.year ? vinyl.year.toString() : '',
      location: vinyl.location || '',
      cost: vinyl.cost.toString(),
      speed: vinyl.speed || '',
      rating: vinyl.rating ? vinyl.rating.toString() : '',
      notes: vinyl.notes || '',
      cover_url: vinyl.cover_url || '',
      label: vinyl.label || '',
      genre: vinyl.genre || '',
      discogs_id: vinyl.discogs_id || 0
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: newItem.title,
      artist: newItem.artist,
      location: newItem.location,
      speed: newItem.speed,
      notes: newItem.notes,
      year: parseInt(newItem.year) || null,
      cost: parseFloat(newItem.cost) || 0,
      rating: parseInt(newItem.rating) || null,
      cover_url: newItem.cover_url || null,
      label: newItem.label || null,
      genre: newItem.genre || null,
      discogs_id: newItem.discogs_id || null
    };

    if (editingId) {
        // UPDATE (Modifica esistente)
        const { data, error } = await supabase
            .from('vinyls')
            .update(payload)
            .eq('id', editingId)
            .select();
        
        if (error) {
            alert("Errore salvataggio: " + error.message);
        } else if (data) {
            // Aggiorniamo la lista locale con i nuovi dati (compresa la copertina!)
            setVinyls(vinyls.map(v => v.id === editingId ? data[0] : v));
            setIsModalOpen(false);
            setEditingId(null);
        }
    } else {
        // INSERT (Nuovo inserimento)
        // Nota: non passiamo 'id' se è autoincrementale su Supabase, altrimenti passalo come facevi prima
        const { data, error } = await supabase
            .from('vinyls')
            .insert([payload]) 
            .select();
        
        if (error) {
            alert("Errore inserimento: " + error.message);
        } else if (data) {
            setVinyls([...vinyls, data[0]]);
            setIsModalOpen(false);
        }
    }
  };

  const handleDelete = async (idToDelete: number) => {
    if (!confirm("Vuoi eliminare questo vinile?")) return;
    const { error } = await supabase.from('vinyls').delete().eq('id', idToDelete);
    if (!error) {
      setVinyls(vinyls.filter(v => v.id !== idToDelete));
    }
  };

  const handleSort = (key: keyof Vinyl) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Logica di ordinamento e filtro (esistente)
  const sortedAndFiltered = useMemo(() => {
    const items = vinyls.filter((v) =>
      v.artist.toLowerCase().includes(search.toLowerCase()) ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      (v.notes && v.notes.toLowerCase().includes(search.toLowerCase()))
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

  // *** NUOVO: Calcolo dei vinili impaginati ***
  const paginatedVinyls = useMemo(() => {
    if (itemsPerPage === 'all') return sortedAndFiltered;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedAndFiltered.slice(startIndex, endIndex);
  }, [sortedAndFiltered, currentPage, itemsPerPage]);

  // *** NUOVO: Calcolo pagine totali ***
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedAndFiltered.length / itemsPerPage);

  // Fix per il calcolo del totale (dal suggerimento precedente)
  const totalValue = sortedAndFiltered.reduce((acc, v) => acc + (Number(v.cost) || 0), 0);

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
        <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row items-center gap-4 py-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cerca per artista, album o note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900 border-none shadow-sm focus-visible:ring-violet-500"
            />
          </div>

          {/* *** NUOVO: Selettore Elementi per pagina *** */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-sm text-slate-500 whitespace-nowrap">Mostra:</span>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">Tutti</option>
            </select>
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
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Costo</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* *** MODIFICATO: Uso paginatedVinyls invece di sortedAndFiltered *** */}
                {paginatedVinyls.map((vinyl) => (
                  <TableRow key={vinyl.id} className="hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-colors border-slate-50 dark:border-slate-800 group">
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">{vinyl.artist}</TableCell>
                    <TableCell className="text-slate-900 dark:text-slate-100 flex items-center gap-2" onClick={() => setPosterVinyl(vinyl)}>
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
                    <TableCell className="max-w-[200px] truncate text-slate-500 text-sm italic">{vinyl.notes}</TableCell>
                    <TableCell className="text-right font-bold text-violet-600 dark:text-violet-400">
                      {/* *** FIX applicato per sicurezza *** */}
                      {Number(vinyl.cost || 0).toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => openEditModal(vinyl)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(vinyl.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* *** NUOVO: Footer con paginazione *** */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Pagina <span className="font-bold text-violet-600">{currentPage}</span> di {totalPages}
                <span className="hidden sm:inline ml-2">({sortedAndFiltered.length} vinili totali)</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Il resto del modale rimane identico... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold">{editingId ? "Modifica Vinile" : "Nuovo Vinile"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/*Barra di ricerca discogs*/}
            {!editingId && (
              <div className="px-6 pt-6 pb-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <Label className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-2 block">
                  Importa da Discogs (Opzionale)
                </Label>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Cerca Artista, Album o Barcode..."
                    value={discogsQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => setDiscogsQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDiscogsSearch()}
                    className="bg-white dark:bg-slate-950"
                  />
                  {/* Tasto "X" per annullare la ricerca e mostrare il form manuale */}
                  {(isSearchFocused || discogsQuery) && (
                    <Button variant="ghost" onClick={() => {
                      setDiscogsQuery('');
                      setIsSearchFocused(false);
                      setSearchResults([]);
                    }}>
                      <X />
                    </Button>
                  )}
                </div>

                {/* RISULTATI DELLA RICERCA */}
                {showResults && searchResults.length > 0 && (
                  <div className="mb-4 max-h-48 overflow-y-auto space-y-2 border rounded-md p-2 bg-white dark:bg-slate-950">
                    {searchResults.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => selectDiscogsItem(res)}
                        className="flex items-center gap-3 p-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 cursor-pointer rounded-lg transition-colors group"
                      >
                        <div className="h-10 w-10 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                          {res.thumb ? <img src={res.thumb} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="p-2 h-full w-full text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate text-slate-700 dark:text-slate-200">{res.title}</p>
                          <p className="text-xs text-slate-500">{res.year} • {res.country} • {res.label?.[0]}</p>
                        </div>
                        <Download className="h-4 w-4 text-slate-300 group-hover:text-violet-600" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* FORM MANUALE (Collassabile) */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${(!editingId && (isSearchFocused || discogsQuery.length > 0))
              ? 'max-h-0 opacity-0'
              : 'max-h-[1200px] opacity-100' // max-h alto per permettere l'apertura
              }`}>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="id" className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <Hash className="h-3 w-3" /> ID {editingId ? "(Non modificabile)" : "Sequenziale"}
                  </Label>
                  <Input id="id" value={newItem.id} disabled className="bg-slate-100 text-slate-500 font-mono font-bold" />
                </div>
                <div className="space-y-2">
                  <Label>Artista</Label>
                  <Input required placeholder="Es. Pink Floyd" value={newItem.artist} onChange={(e) => setNewItem({ ...newItem, artist: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Titolo Album</Label>
                  <Input required placeholder="Es. The Dark Side of the Moon" value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Anno</Label>
                    <Input type="number" placeholder="1973" value={newItem.year} onChange={(e) => setNewItem({ ...newItem, year: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Giri</Label>
                    <Input placeholder="33, 45..." value={newItem.speed} onChange={(e) => setNewItem({ ...newItem, speed: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Voto (1-10)</Label>
                    <Input type="number" min="1" max="10" placeholder="8" value={newItem.rating} onChange={(e) => setNewItem({ ...newItem, rating: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Posizione</Label>
                    <Input placeholder="Scaffale B" value={newItem.location} onChange={(e) => setNewItem({ ...newItem, location: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <StickyNote className="h-3 w-3" /> Note
                  </Label>
                  <Input placeholder="Es. Edizione limitata..." value={newItem.notes} onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Costo (€)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={newItem.cost} onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-4 mt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Annulla</Button>
                  <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">Conferma</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {posterVinyl && (
        <VinylPoster vinyl={posterVinyl} onClose={() => setPosterVinyl(null)} />
      )}

    </div>
  );
}
function VinylPoster({ vinyl, onClose }: { vinyl: any, onClose: () => void }) {
  if (!vinyl) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
        
        {/* IL POSTER */}
        <div className="relative w-full max-w-md bg-[#EBE9E1] text-[#333] shadow-2xl overflow-hidden rounded-sm animate-in zoom-in-95 duration-300">
            
            {/* Tasto Chiudi */}
            <button onClick={onClose} className="absolute top-2 right-2 z-10 bg-black/10 hover:bg-black/20 text-white rounded-full p-1 transition-colors">
                <X size={20} />
            </button>

            {/* 1. IMMAGINE */}
            <div className="aspect-square w-full bg-zinc-200 relative">
                {vinyl.cover_url ? (
                    <img src={vinyl.cover_url} alt={vinyl.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                        <Disc size={100} />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/5 pointer-events-none mix-blend-multiply"></div>
            </div>

            {/* 2. TESTO */}
            <div className="p-8 pb-12 font-sans">
                {/* Titolo e Anno */}
                <div className="flex items-baseline gap-3 mb-6 border-b border-zinc-300 pb-4">
                    <h2 className="text-4xl font-bold uppercase tracking-tighter leading-none font-sans">
                        {vinyl.title}
                    </h2>
                    <span className="text-2xl font-light text-zinc-500 font-sans">
                        {vinyl.year}
                    </span>
                </div>

                {/* Dettagli */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs uppercase tracking-widest text-zinc-600 font-semibold">
                    <div>
                        <span className="block text-[10px] text-zinc-400 mb-0.5">Artist</span>
                        <span className="text-black text-sm">{vinyl.artist}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-zinc-400 mb-0.5">Label</span>
                        <span className="text-black">{vinyl.label || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-zinc-400 mb-0.5">Genre</span>
                        <span className="text-black">{vinyl.genre || 'Music'}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-zinc-400 mb-0.5">Rating</span>
                        <div className="flex gap-1">
                             {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className={`h-2 w-2 rounded-full ${i < Math.round(vinyl.rating / 2) ? 'bg-black' : 'bg-zinc-300'}`} />
                             ))}
                        </div>
                    </div>
                    
                    {vinyl.notes && (
                        <div className="col-span-2 mt-4 normal-case tracking-normal border-t border-zinc-200 pt-3">
                            <p className="font-serif italic text-zinc-500 leading-relaxed text-sm">
                                "{vinyl.notes}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-2 left-0 right-0 text-center text-[8px] text-zinc-400 uppercase tracking-[0.2em]">
                Vinile Collection • {vinyl.location || 'Archivio'}
            </div>
        </div>
    </div>
  );
}