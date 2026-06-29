
/**
 * Status of a Dutch auction.
 */
export type DutchAuctionStatus = 'Active' | 'Completed' | 'Cancelled';

/**
 * Represents an NFT for sale in a Dutch auction.
 */
export interface DutchAuctionNFT {
  id: string;
  name: string;
  description: string;
  image: string;
  collection: string;
  tokenId: string;
}

/**
 * Canonical Dutch auction shape.
 */
export interface DutchAuction {
  id: string;
  nft: DutchAuctionNFT;
  seller: string;
  startPrice: number;
  floorPrice: number;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  status: DutchAuctionStatus;
  winner?: string;
  finalPrice?: number;
}

