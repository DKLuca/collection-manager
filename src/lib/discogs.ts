const DISCOGS_TOKEN = import.meta.env.VITE_DISCOGS_TOKEN;
const BASE_URL = "https://api.discogs.com/database/search";

export type DiscogsResult = {
  id: number;
  title: string; // Formato solito: "Artista - Album"
  year?: string;
  cover_image: string;
  thumb: string;
  country?: string;
  label?: string[];
  genre?: string[];
  catno?: string; // Numero di catalogo
};

export const searchDiscogs = async (query: string): Promise<DiscogsResult[]> => {
  if (!query) return [];

  // Se la query sembra un barcode (solo numeri e lunga), cerchiamo per barcode
  const isBarcode = /^\d+$/.test(query) && query.length > 8;
  
  const params = new URLSearchParams({
    token: DISCOGS_TOKEN,
    type: 'release', // Cerchiamo uscite specifiche, non artisti generici
    per_page: '10',  // Limitiamo a 10 risultati
  });

  if (isBarcode) {
    params.append('barcode', query);
  } else {
    params.append('q', query); // Ricerca generica (testo)
  }

  try {
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error('Errore nella ricerca Discogs');
    
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error(error);
    return [];
  }
};