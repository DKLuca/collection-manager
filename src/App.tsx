import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Vinyls from './pages/Vinyls';
import CDs from './pages/CDs';
import ReadBooks from './pages/ReadBooks';
import OwnedBooks from './pages/OwnedBooks';
import NotFound from './pages/NotFound';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <Toaster />
        <BrowserRouter>
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/vinyls" element={<Vinyls />} />
              <Route path="/cds" element={<CDs />} />
              <Route path="/read-books" element={<ReadBooks />} />
              <Route path="/owned-books" element={<OwnedBooks />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;