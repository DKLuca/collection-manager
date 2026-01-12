import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { findITunesCover } from '@/lib/itunes';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function CoverUpdater() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const startUpdate = async () => {
    if (!confirm("Questo processo cercherà le copertine per TUTTI i vinili che ne sono privi. Potrebbe volerci qualche minuto. Vuoi procedere?")) return;
    
    setLoading(true);
    setLogs([]);
    
    // 1. Scarichiamo solo i vinili SENZA copertina (o con stringa vuota)
    const { data: vinyls, error } = await supabase
      .from('vinyls')
      .select('*')
      .or('cover_url.is.null,cover_url.eq.""'); // Prende null o vuoti

    if (error || !vinyls) {
      alert("Errore caricamento vinili: " + error?.message);
      setLoading(false);
      return;
    }

    const total = vinyls.length;
    setStatus(`Trovati ${total} vinili senza copertina. Inizio...`);
    
    let updatedCount = 0;

    // 2. Ciclo su ogni vinile
    for (let i = 0; i < total; i++) {
      const v = vinyls[i];
      
      // Aggiorniamo la barra di progresso
      const percentage = Math.round(((i + 1) / total) * 100);
      setProgress(percentage);
      setStatus(`Elaborazione ${i + 1}/${total}: ${v.artist} - ${v.title}...`);

      try {
        // Usiamo la tua funzione V9 perfetta
        const coverUrl = await findITunesCover(v.artist, v.title);

        if (coverUrl) {
          // Aggiorniamo il DB
          await supabase
            .from('vinyls')
            .update({ cover_url: coverUrl }) // Aggiorna solo la copertina
            .eq('id', v.id);
            
          setLogs(prev => [`✅ [${v.artist}] Cover trovata`, ...prev]);
          updatedCount++;
        } else {
          setLogs(prev => [`❌ [${v.artist}] Nessuna cover su iTunes`, ...prev]);
        }

      } catch (e) {
        console.error(e);
      }

      // 3. Pausa Tattica (Rate Limiting)
      // Aspettiamo 500ms tra una chiamata e l'altra per non far arrabbiare Apple
      await new Promise(r => setTimeout(r, 500));
    }

    setStatus(`Finito! Aggiornati ${updatedCount} su ${total} vinili.`);
    setLoading(false);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-violet-200 dark:border-violet-900/30 p-6 rounded-xl mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
            <h3 className="font-bold text-violet-700 dark:text-violet-400 flex items-center gap-2">
                <Wand2 className="h-5 w-5" /> Auto-Updater Copertine
            </h3>
            <p className="text-xs text-slate-500">
                Usa questo tool una volta sola per scaricare le copertine mancanti.
            </p>
        </div>
        <Button 
            onClick={startUpdate} 
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white"
        >
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Avvia Magia"}
            {loading ? "Elaborazione..." : "Cerca Copertine Mancanti"}
        </Button>
      </div>

      {loading && (
        <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span>{status}</span>
                <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Log in tempo reale */}
            <div className="h-32 overflow-y-auto bg-black/5 dark:bg-black/30 rounded p-2 text-xs font-mono mt-2">
                {logs.map((log, idx) => (
                    <div key={idx} className={log.includes('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-500/70'}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}