// src/lib/googleBooks.ts

export type BookResult = {
  id: string;
  title: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    extraLarge?: string;
  };
  isbn?: string;
  price?: number;
};

// --- IMAGE FIXER V3 (Il più robusto) ---
const getBestImage = (id: string, imageLinks: any): string => {
  // 1. Se Google non ci dà nessun link, proviamo a costruirne uno generico basato sull'ID
  if (!imageLinks) {
    return `https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&fife=w600&source=gbs_api`;
  }

  // 2. Prendiamo l'URL migliore disponibile
  let url = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.thumbnail || imageLinks.smallThumbnail || "";
  
  if (!url) return "";

  // 3. Assicuriamo HTTPS
  url = url.replace('http://', 'https://');

  // 4. RICOSTRUZIONE URL PER "FIFE" (Alta Qualità)
  // I link di Google sono spesso sporchi. Proviamo a estrarre l'ID e ricostruire un link pulito.
  try {
    // Cerchiamo l'ID dentro l'URL (es: id=Sm5AKDX...)
    const urlObj = new URL(url);
    const idParam = urlObj.searchParams.get('id');
    
    // Se troviamo l'ID, ignoriamo il vecchio link e ne creiamo uno nuovo perfetto
    if (idParam) {
        // "fife=w600" è il parametro magico che genera l'immagine a 600px
        return `https://books.google.com/books/content?id=${idParam}&printsec=frontcover&img=1&fife=w600`;
    }
  } catch (e) {
    // Se qualcosa va storto, proseguiamo col vecchio metodo
  }

  // 5. Fallback manuale se la ricostruzione fallisce
  url = url.replace('&edge=curl', ''); // Via la piega pagina
  
  // Se c'è uno zoom, lo sostituiamo con fife
  if (url.includes('&zoom=')) {
      url = url.replace(/&zoom=\d/, '&fife=w600');
  } else {
      url += '&fife=w600';
  }

  return url;
};

export const searchGoogleBooks = async (query: string): Promise<BookResult[]> => {
  try {
    const isIsbn = /^\d{10,13}$/.test(query.trim());
    const finalQuery = isIsbn ? `isbn:${query}` : query;

    // &country=IT è fondamentale per i prezzi e la disponibilità
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(finalQuery)}&maxResults=20&printType=books&langRestrict=it&country=IT`);
    
    if (!response.ok) throw new Error("Errore Google Books");
    
    const data = await response.json();
    
    if (!data.items) return [];

    return data.items.map((item: any) => {
      const info = item.volumeInfo;
      const sale = item.saleInfo;

      const isbnObj = info.industryIdentifiers?.find((id: any) => id.type === "ISBN_13") || info.industryIdentifiers?.find((id: any) => id.type === "ISBN_10");

      // Usiamo la funzione Fixer passando anche l'ID del volume
      const bestCover = getBestImage(item.id, info.imageLinks);

      let foundPrice = 0;
      if (sale && sale.listPrice?.amount) {
          foundPrice = sale.listPrice.amount;
      } else if (sale && sale.retailPrice?.amount) {
          foundPrice = sale.retailPrice.amount;
      }

      return {
        id: item.id,
        title: info.title,
        authors: info.authors || ["Sconosciuto"],
        publisher: info.publisher,
        publishedDate: info.publishedDate,
        description: info.description,
        pageCount: info.pageCount,
        categories: info.categories,
        imageLinks: { thumbnail: bestCover },
        isbn: isbnObj ? isbnObj.identifier : undefined,
        price: foundPrice
      };
    });

  } catch (error) {
    console.error("Errore ricerca Libri:", error);
    return [];
  }
};