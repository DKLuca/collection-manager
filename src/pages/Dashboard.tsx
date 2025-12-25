import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Disc, Library, Music, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Colori per il grafico a torta
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalValue: 0,
    booksOwnedCount: 0,
    vinylsCount: 0,
    cdsCount: 0,
    booksReadCount: 0,
    totalPagesRead: 0,
    topLongestBooks: [] as any[]
  });

  const [goal, setGoal] = useState(12); // Obiettivo annuale default
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState("12");

  // CARICAMENTO DATI DA SUPABASE
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Eseguiamo tutte le richieste in parallelo per velocità
        const [
            { data: ownedBooks }, 
            { data: vinyls }, 
            { data: cds }, 
            { data: readBooks }
        ] = await Promise.all([
            supabase.from('owned_books').select('cost'), // Ci serve solo il costo
            supabase.from('vinyls').select('cost'),      // Ci serve solo il costo
            supabase.from('cds').select('cost'),         // Ci serve solo il costo
            supabase.from('read_books').select('title, pages') // Ci servono titolo e pagine
        ]);

        // 2. Calcoli sui Libri Posseduti
        const safeOwnedBooks = ownedBooks || [];
        const valBooks = safeOwnedBooks.reduce((acc, item) => acc + (item.cost || 0), 0);

        // 3. Calcoli sui Vinili
        const safeVinyls = vinyls || [];
        const valVinyls = safeVinyls.reduce((acc, item) => acc + (item.cost || 0), 0);

        // 4. Calcoli sui CD
        const safeCds = cds || [];
        const valCds = safeCds.reduce((acc, item) => acc + (item.cost || 0), 0);

        // 5. Calcoli sui Libri Letti
        const safeReadBooks = readBooks || [];
        const totalPages = safeReadBooks.reduce((acc, item) => acc + (item.pages || 0), 0);

        // Prepariamo i dati per il grafico (Top 5 più lunghi)
        const sortedByPages = [...safeReadBooks]
            .sort((a, b) => (b.pages || 0) - (a.pages || 0))
            .slice(0, 5)
            .map(book => ({
                name: book.title,
                value: book.pages
            }));

        // 6. Aggiorniamo lo stato
        setStats({
            totalValue: valBooks + valVinyls + valCds,
            booksOwnedCount: safeOwnedBooks.length,
            vinylsCount: safeVinyls.length,
            cdsCount: safeCds.length,
            booksReadCount: safeReadBooks.length,
            totalPagesRead: totalPages,
            topLongestBooks: sortedByPages
        });

      } catch (error) {
        console.error("Errore caricamento dashboard:", error);
      }
    };

    fetchDashboardData();

    // Carica l'obiettivo salvato nel browser
    const savedGoal = localStorage.getItem("reading-goal");
    if (savedGoal) {
        setGoal(parseInt(savedGoal));
        setTempGoal(savedGoal);
    }

  }, []);

  // Funzione per salvare l'obiettivo
  const saveGoal = () => {
    const newGoal = parseInt(tempGoal);
    if (newGoal > 0) {
      setGoal(newGoal);
      localStorage.setItem("reading-goal", newGoal.toString());
      setIsEditingGoal(false);
    }
  };

  const progressPercentage = Math.min(100, Math.round((stats.booksReadCount / goal) * 100));

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500">Panoramica in tempo reale della tua collezione.</p>
      </div>

      {/* CARDS STATISTICHE */}
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

      {/* SEZIONE OBIETTIVI E GRAFICO */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* COLONNA SINISTRA: OBIETTIVO LETTURA */}
        <Card className="col-span-4 shadow-md border-none bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Obiettivo Lettura
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
                <Button variant="ghost" size="sm" onClick={() => setIsEditingGoal(true)} className="text-xs text-slate-400">
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
                  <div className="text-orange-600 dark:text-orange-400 font-semibold text-sm uppercase tracking-wide">Pagine Totali</div>
                  <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">{stats.totalPagesRead}</div>
               </div>
               <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                  <div className="text-blue-600 dark:text-blue-400 font-semibold text-sm uppercase tracking-wide">Libri Letti</div>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.booksReadCount}</div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* COLONNA DESTRA: GRAFICO A TORTA */}
        <Card className="col-span-3 shadow-md border-none bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              Top 5 Libri più lunghi
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
                    Nessun dato di lettura
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente Helper per le Card piccole
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