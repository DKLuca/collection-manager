// src/lib/openLibrary.ts

export const findOpenLibraryCover = async (isbn: string): Promise<string | null> => {
  if (!isbn) return null;

  // Puliamo l'ISBN da trattini o spazi
  const cleanIsbn = isbn.replace(/-/g, '').trim();
  
  // URL di Open Library per l'immagine Large (L)
  // Aggiungiamo ?default=false così se non ce l'ha ci risponde 404 invece di darci un pixel vuoto
  const url = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`;

  try {
    // Facciamo una richiesta "HEAD" solo per vedere se l'immagine esiste (senza scaricarla tutta subito)
    const response = await fetch(url, { method: 'GET' }); // OpenLibrary a volte non supporta HEAD su immagini, usiamo GET
    
    if (response.status === 200) {
      console.log("✅ Trovata cover HD su Open Library!");
      return url; // Ritorniamo l'URL diretto
    }
  } catch (e) {
    console.error("Errore OpenLibrary", e);
  }
  
  return null;
};