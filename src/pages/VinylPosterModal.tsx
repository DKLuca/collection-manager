import { X, Disc } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog'; // Se usi shadcn dialog, altrimenti un div fixed classico

// Se non usi shadcn per i modali, usa un div fixed come facevi prima. 
// Qui uso una struttura HTML generica che puoi mettere nel tuo modale personalizzato.

export function VinylPoster({ vinyl, onClose }: { vinyl: any, onClose: () => void }) {
  if (!vinyl) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
        
        {/* IL POSTER */}
        <div className="relative w-full max-w-md bg-[#EBE9E1] text-[#333] shadow-2xl overflow-hidden rounded-sm animate-in zoom-in-95 duration-300">
            
            {/* Tasto Chiudi (Nascosto o discreto) */}
            <button onClick={onClose} className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full p-1">
                <X size={20} />
            </button>

            {/* 1. IMMAGINE (Quadrata o 4:3) */}
            <div className="aspect-square w-full bg-slate-200 relative">
                {vinyl.cover_url ? (
                    <img src={vinyl.cover_url} alt={vinyl.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                        <Disc size={100} />
                    </div>
                )}
                {/* Effetto grana/vecchio opzionale */}
                <div className="absolute inset-0 bg-black/5 pointer-events-none mix-blend-multiply"></div>
            </div>

            {/* 2. TESTO (Stile Minimalista) */}
            <div className="p-8 pb-12 font-sans">
                
                {/* Titolo Gigante e Anno */}
                <div className="flex items-baseline gap-3 mb-6 border-b border-zinc-300 pb-4">
                    <h2 className="text-5xl font-bold uppercase tracking-tighter leading-none" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        {vinyl.title}
                    </h2>
                    <span className="text-3xl font-light text-zinc-500" style={{ fontFamily: 'Oswald, sans-serif' }}>
                        {vinyl.year}
                    </span>
                </div>

                {/* Dettagli a Colonne (come i crediti del film) */}
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
                    
                    {/* Note che simulano il "Starring" */}
                    {vinyl.notes && (
                        <div className="col-span-2 mt-4">
                            <span className="block text-[10px] text-zinc-400 mb-0.5">Notes</span>
                            <p className="normal-case tracking-normal font-serif italic text-zinc-500 leading-relaxed">
                                "{vinyl.notes}"
                            </p>
                        </div>
                    )}

                </div>
            </div>
            
            {/* Footer piccolissimo */}
            <div className="absolute bottom-2 left-0 right-0 text-center text-[8px] text-zinc-400 uppercase tracking-[0.2em]">
                Vinile Collection • {vinyl.location || 'Archivio'}
            </div>
        </div>
    </div>
  );
}