import { ProductSchema } from '../src/modules/products/schemas/product.schema';
import { AuctionSchema } from '../src/modules/auctions/schemas/auction.schema';
import { BidSchema } from '../src/modules/bids/schemas/bid.schema';
import { WalletTransactionSchema } from '../src/modules/wallets/schemas/wallet-transaction.schema';
describe('marketplace schema indexes', () => {
  it('defines product search and listing indexes', () => { expect(ProductSchema.indexes()).toEqual(expect.arrayContaining([[{ title: 'text', description: 'text' }, expect.any(Object)]])); });
  it('defines auction concurrency lookup indexes', () => { expect(AuctionSchema.indexes().some(([i]) => i.status === 1 && i.endAt === 1)).toBe(true); });
  it('keeps bids outside auctions with bid history indexes', () => { expect(BidSchema.indexes().some(([i]) => i.auctionId === 1 && i.createdAt === -1)).toBe(true); });
  it('defines immutable ledger history indexes', () => { expect(WalletTransactionSchema.indexes().some(([i]) => i.walletId === 1 && i.createdAt === -1)).toBe(true); });
});