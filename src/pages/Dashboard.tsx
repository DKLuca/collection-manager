import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Disc, Library, Music, Target, TrendingUp, CalendarDays, CalendarClock, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// Import unificati di Recharts
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis
} from 'recharts';
// Colori per i grafici
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const RATING_COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#94a3b8', '#64748b'];

export default function Dashboard() {
  // Gestione Anno
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(Math.max(2025, currentYear));
  
  // Dati grezzi (Raw)
  const [rawReadBooks, setRawReadBooks] = useState<any[]>([]);
  const [rawVinyls, setRawVinyls] = useState<any[]>([]); // *** NUOVO: Salviamo i vinili completi
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Statistiche Inventario (Globali) + Statistiche Lettura (Annuali)
  const [stats, setStats] = useState({
    // Globali
    totalValue: 0,
    booksOwnedCount: 0,
    vinylsCount: 0,
    cdsCount: 0,
    // Annuali (dipendono da selectedYear)
    booksReadCount: 0,
    totalPagesRead: 0,
    topLongestBooks: [] as any[]
  });

  const [goal, setGoal] = useState(12);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState("12");

  // 1. CARICAMENTO DATI INIZIALE
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
            { data: ownedBooks }, 
            { data: vinyls }, // *** MODIFICATO: Ora scarichiamo tutto l'oggetto vinyls
            { data: cds }, 
            { data: readBooks }
        ] = await Promise.all([
            supabase.from('owned_books').select('cost'),
            supabase.from('vinyls').select('*'), // Scarico tutto per i grafici
            supabase.from('cds').select('cost'),
            supabase.from('read_books').select('title, pages, read_year')
        ]);

        // Calcoli Globali
        const safeOwnedBooks = ownedBooks || [];
        const valBooks = safeOwnedBooks.reduce((acc, item) => acc + (item.cost || 0), 0);

        const safeVinyls = vinyls || [];
        const valVinyls = safeVinyls.reduce((acc, item) => acc + (item.cost || 0), 0);

        const safeCds = cds || [];
        const valCds = safeCds.reduce((acc, item) => acc + (item.cost || 0), 0);

        // Salviamo i dati grezzi
        setRawReadBooks(readBooks || []);
        setRawVinyls(safeVinyls); // *** NUOVO

        // Aggiorniamo stats globali
        setStats(prev => ({
            ...prev,
            totalValue: valBooks + valVinyls + valCds,
            booksOwnedCount: safeOwnedBooks.length,
            vinylsCount: safeVinyls.length,
            cdsCount: safeCds.length,
        }));

      } catch (error) {
        console.error("Errore caricamento dashboard:", error);
      }
    };

    fetchDashboardData();
  }, []);

  // 2. EFFETTO CAMBIO ANNO (Logica Libri)
  useEffect(() => {
    const yearBooks = rawReadBooks.filter(book => book.read_year === selectedYear);
    const totalPages = yearBooks.reduce((acc, item) => acc + (item.pages || 0), 0);

    const sortedByPages = [...yearBooks]
        .sort((a, b) => (b.pages || 0) - (a.pages || 0))
        .slice(0, 5)
        .map(book => ({
            name: book.title,
            value: book.pages
        }));

    setStats(prev => ({
        ...prev,
        booksReadCount: yearBooks.length,
        totalPagesRead: totalPages,
        topLongestBooks: sortedByPages
    }));

    // Carica Obiettivo
    const storageKey = `reading-goal-${selectedYear}`;
    const savedGoal = localStorage.getItem(storageKey);
    if (savedGoal) {
        setGoal(parseInt(savedGoal));
        setTempGoal(savedGoal);
    } else {
        setGoal(12);
        setTempGoal("12");
    }

  }, [selectedYear, rawReadBooks]);

  // --- CALCOLI GRAFICI VINILI (Globali) ---
  
  // A. Decadi
  const vinylDecadesData = useMemo(() => {
    const data: Record<string, number> = {};
    rawVinyls.forEach(v => {
      if (v.year) {
        const decade = Math.floor(v.year / 10) * 10;
        const label = `${decade}s`;
        data[label] = (data[label] || 0) + 1;
      }
    });
    return Object.keys(data).sort().map(key => ({ name: key, count: data[key] }));
  }, [rawVinyls]);

  // B. Voti (Rating)
  const vinylRatingsData = useMemo(() => {
      const data: Record<string, number> = {};
      rawVinyls.forEach(v => {
        if (v.rating) data[v.rating] = (data[v.rating] || 0) + 1;
      });
      return Object.keys(data)
        .sort((a, b) => Number(b) - Number(a))
        .map(key => ({ 
            name: `${key}/10`, 
            value: data[key], 
            rawRating: parseInt(key) // Dato nascosto utile per il click
        }));
    }, [rawVinyls]);

  // C. Costo vs Anno
  const vinylCostVsYearData = useMemo(() => {
    return rawVinyls
        .filter(v => v.year && v.cost > 0)
        .map(v => ({ x: v.year, y: v.cost, title: v.title, artist: v.artist }));
  }, [rawVinyls]);

  const vinylsBySelectedRating = useMemo(() => {
      if (selectedRating === null) return [];
      return rawVinyls.filter(v => v.rating === selectedRating);
  }, [selectedRating, rawVinyls]);

  // --- FINE CALCOLI VINILI ---

  const saveGoal = () => {
    const newGoal = parseInt(tempGoal);
    if (newGoal > 0) {
      setGoal(newGoal);
      localStorage.setItem(`reading-goal-${selectedYear}`, newGoal.toString());
      setIsEditingGoal(false);
    }
  };

  const yearsList = useMemo(() => {
    const startYear = 2025;
    const endYear = currentYear + 1; 
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
        years.push(y);
    }
    if (years.length === 0) return [2025];
    return years;
  }, [currentYear]);

  const progressPercentage = goal > 0 ? Math.min(100, Math.round((stats.booksReadCount / goal) * 100)) : 0;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500">Panoramica in tempo reale della tua collezione.</p>
      </div>

      {/* CARDS STATISTICHE GLOBALI (INVENTARIO) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Valore Collezione" 
          value={`${stats.totalValue.toFixed(2)}€`} 
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} 
          desc="Investimento totale"
        />
        <StatCard 
          title="Vinili" 
          value={stats.vinylsCount} 
          icon={<Disc className="h-4 w-4 text-violet-600" />} 
          desc="Dischi in archivio"
        />
        <StatCard 
          title="CD Musicali" 
          value={stats.cdsCount} 
          icon={<Music className="h-4 w-4 text-pink-600" />} 
          desc="Album Compact Disc"
        />
        <StatCard 
          title="Biblioteca Fisica" 
          value={stats.booksOwnedCount} 
          icon={<Library className="h-4 w-4 text-blue-600" />} 
          desc="Libri sullo scaffale"
        />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 my-6"></div>

      {/* SEZIONE LETTURA (FILTRO ANNUALE) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500"/> Statistiche Lettura
            </h2>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                <CalendarDays className="h-4 w-4 text-slate-500 ml-2" />
                <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-bold focus:ring-0 cursor-pointer"
                >
                    {yearsList.map(year => (
                        <option key={year} value={year}>{year}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            
            {/* OBIETTIVO LETTURA */}
            <Card className="col-span-4 shadow-md border-none bg-white dark:bg-slate-900 transition-all duration-300">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-500" />
                    Obiettivo {selectedYear}
                </div>
                {isEditingGoal ? (
                    <div className="flex gap-2">
                    <Input 
                        type="number" 
                        value={tempGoal} 
                        onChange={(e) => setTempGoal(e.target.value)} 
                        className="w-20 h-8"
                    />
                    <Button size="sm" onClick={saveGoal}>OK</Button>
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingGoal(true)} className="text-xs text-slate-400 hover:text-slate-600">
                    Modifica: {goal}
                    </Button>
                )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Progresso</span>
                    <span className="text-slate-500">{stats.booksReadCount} di {goal} libri</span>
                </div>
                <Progress value={progressPercentage} className="h-3 bg-slate-100 dark:bg-slate-800" />
                <p className="text-xs text-slate-400 text-right">{progressPercentage}% completato</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/20">
                    <div className="text-orange-600 dark:text-orange-400 font-semibold text-sm uppercase tracking-wide">Pagine ({selectedYear})</div>
                    <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">{stats.totalPagesRead}</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                    <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wide">Libri Letti ({selectedYear})</div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.booksReadCount}</div>
                </div>
                </div>
            </CardContent>
            </Card>

            {/* TOP 5 LIBRI */}
            <Card className="col-span-3 shadow-md border-none bg-white dark:bg-slate-900">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                Top 5 Libri più lunghi ({selectedYear})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                {stats.topLongestBooks.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={stats.topLongestBooks}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {stats.topLongestBooks.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic gap-2">
                        <BookOpen className="h-8 w-8 opacity-20" />
                        Nessun dato per il {selectedYear}
                    </div>
                )}
                </div>
            </CardContent>
            </Card>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 my-8"></div>

      {/* *** NUOVA SEZIONE: ANALISI VINILI *** */}
      {stats.vinylsCount > 0 && (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Disc className="h-5 w-5 text-violet-500"/> Analisi Collezione Vinili
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
                {/* 1. GRAFICO DECADI (Invariato) */}
                <Card className="col-span-1 lg:col-span-2 border-none shadow-md bg-white dark:bg-slate-900">
                    {/* ... Contenuto identico a prima ... */}
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4 text-slate-500" /> Storia Musicale (Decadi)</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vinylDecadesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                                <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Vinili" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. GRAFICO VOTI (INTERATTIVO) */}
                <Card className="border-none shadow-md bg-white dark:bg-slate-900">
                    <CardHeader>
                        <CardTitle className="text-base flex justify-between items-center">
                            Qualità (Voti)
                            <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Clicca le fette</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={vinylRatingsData} 
                                    cx="50%" cy="50%" 
                                    innerRadius={60} outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                    // *** NUOVO: Evento Click ***
                                    onClick={(data) => setSelectedRating(data.rawRating)}
                                    className="cursor-pointer focus:outline-none"
                                >
                                    {vinylRatingsData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={RATING_COLORS[index % RATING_COLORS.length]} 
                                            className="hover:opacity-80 transition-opacity stroke-white dark:stroke-slate-900 stroke-2"
                                        />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none'}} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '12px'}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 3. SCATTER PLOT (Invariato) */}
                <Card className="border-none shadow-md bg-white dark:bg-slate-900">
                    {/* ... (Contenuto identico a prima) ... */}
                    <CardHeader><CardTitle className="text-base">Costo vs Anno</CardTitle></CardHeader>
                     <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis type="number" dataKey="x" domain={['auto', 'auto']} tick={{fontSize: 12}} stroke="#94a3b8" name="Anno" />
                                <YAxis type="number" dataKey="y" unit="€" tick={{fontSize: 12}} stroke="#94a3b8" name="Costo" />
                                <ZAxis range={[50, 50]} />
                                <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-white dark:bg-slate-800 p-3 border border-slate-100 rounded-lg shadow-xl text-xs z-50">
                                                    <p className="font-bold text-slate-800 dark:text-white">{data.artist}</p>
                                                    <p className="text-slate-600 dark:text-slate-300 italic mb-1">{data.title}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="bg-blue-100 text-blue-700 px-1.5 rounded">{data.x}</span>
                                                        <span className="bg-green-100 text-green-700 px-1.5 rounded font-bold">{data.y}€</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter data={vinylCostVsYearData} fill="#ec4899" fillOpacity={0.6} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
      )}

      {/* *** NUOVO: IL POPUP (MODAL) *** */}
      {selectedRating !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800">
                
                {/* Intestazione Popup */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                        {/* X Colorata a sinistra come richiesto */}
                        <button 
                            onClick={() => setSelectedRating(null)}
                            className="bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:text-red-400 p-2 rounded-full transition-colors"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                Voto: <span className="text-violet-600">{selectedRating}/10</span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                {vinylsBySelectedRating.length} vinili trovati
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lista Vinili */}
                <div className="max-h-[60vh] overflow-y-auto p-0">
                    {vinylsBySelectedRating.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {vinylsBySelectedRating.map((v) => (
                                <div key={v.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-violet-100 dark:bg-violet-900/20 p-2 rounded-full text-violet-600 dark:text-violet-400">
                                            <Disc size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{v.artist}</p>
                                            <p className="text-sm text-slate-500">{v.title}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded inline-block mb-1">
                                            {v.year || 'N/D'}
                                        </div>
                                        <div className="text-sm font-bold text-violet-600 dark:text-violet-400">
                                            {Number(v.cost).toFixed(2)}€
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            Nessun vinile trovato con questo voto.
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

// Componente Helper per le Card piccole (invariato)
function StatCard({ title, value, icon, desc }: { title: string, value: string | number, icon: any, desc: string }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-none bg-white dark:bg-slate-900">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        <p className="text-xs text-slate-500 mt-1">
          {desc}
        </p>
      </CardContent>
    </Card>
  );
}