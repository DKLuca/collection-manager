// src/lib/itunes.ts

// Pulizia stringhe
const normalize = (str: string) => {
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9 ]/g, "") 
        .trim();
};

async function fetchItunes(url: string) {
    console.log(`🌐 Fetching: ${url}`);
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (e) {
        console.error("Errore iTunes", e);
        return { resultCount: 0, results: [] };
    }
}

// TROVA L'ID DELL'ARTISTA
async function getArtistId(artistName: string): Promise<string | null> {
    const cleanName = normalize(artistName);
    // Cerchiamo l'entità "musicArtist"
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=10&country=IT`;
    const data = await fetchItunes(url);

    if (!data.results) return null;

    // Cerchiamo il match esatto del nome (es. "Nayt" == "Nayt")
    const match = data.results.find((res: any) => normalize(res.artistName) === cleanName);
    
    if (match) {
        console.log(`   👤 Artista Identificato: ${match.artistName} (ID: ${match.artistId})`);
        return match.artistId;
    }
    
    // Fallback: se non c'è match esatto, prendiamo il primo che lo contiene
    const looseMatch = data.results.find((res: any) => normalize(res.artistName).includes(cleanName));
    return looseMatch ? looseMatch.artistId : null;
}

export const findITunesCover = async (artist: string, album: string): Promise<string | null> => {
    const cleanArtist = artist.split('(')[0].trim();
    const cleanAlbum = album.split('(')[0].trim();
    const targetAlbum = normalize(cleanAlbum);

    console.log(`🔎 START RICERCA V9 (Lookup Mode): [${cleanArtist}] - [${cleanAlbum}]`);

    // PASSO 1: Trovare l'ID dell'artista
    const artistId = await getArtistId(cleanArtist);
    
    if (!artistId) {
        console.log("❌ Artista non trovato su iTunes.");
        return null;
    }

    // PASSO 2: Scaricare la discografia usando l'ID (Lookup)
    // Questo restituisce SOLO gli album di quell'artista specifico
    const lookupUrl = `https://itunes.apple.com/lookup?id=${artistId}&entity=album&limit=200&country=IT`;
    console.log("   📂 Scarico discografia ufficiale...");
    
    const data = await fetchItunes(lookupUrl);
    
    // I risultati del lookup contengono l'artista all'indice 0, e gli album dall'indice 1 in poi
    const albums = (data.results || []).filter((r: any) => r.collectionType === 'Album');

    // PASSO 3: Filtrare la discografia pulita
    for (const res of albums) {
        const resAlbum = normalize(res.collectionName || "");
        
        // Log ridotto per debug
        // console.log(`      ? Album: ${res.collectionName}`);

        // Controllo se è il nostro album
        if (resAlbum.includes(targetAlbum) || targetAlbum.includes(resAlbum)) {
            console.log(`      ✅ MATCH TROVATO NELLA DISCOGRAFIA: ${res.collectionName}`);
            return res.artworkUrl100.replace('100x100bb', '1000x1000bb');
        }
    }

    console.log("❌ Album non trovato nella discografia ufficiale.");
    return null;
};