import { Download, Github, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full py-6 px-4 mt-auto border-t bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-500">
          © {new Date().getFullYear()} Collection Manager. Sviluppato con MGX.
        </div>
        <div className="flex items-center gap-6">
          <a 
            href="/collection-manager-source.tar.gz" 
            download
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Scarica Sorgenti (TAG.GZ)
          </a>
          <div className="flex items-center gap-4 text-slate-400">
            <Globe className="h-4 w-4" />
            <Github className="h-4 w-4" />
          </div>
        </div>
      </div>
    </footer>
  );
}