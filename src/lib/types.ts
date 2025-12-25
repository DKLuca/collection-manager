export interface Item {
  id: string;
  author: string;
  title: string;
  year?: number;
  cost: number;
  rating?: number;
  notes?: string;
}

export interface MediaItem extends Item {
  quantity: number;
}

export interface ReadBook {
  id: string;
  author: string;
  title: string;
  yearRead: number;
  pages: number;
  notes?: string;
}

export interface OwnedBook {
  id: string;
  author: string;
  title: string;
  location: string;
  cost: number;
}