export interface Sticker {
  id: string;
  name: string;
  price: number;
  stock: number;
  rarity: '1-Star' | '2-Star' | '3-Star' | '4-Star' | '5-Star' | '6-Star';
  image_url: string;
  is_active: boolean;
}