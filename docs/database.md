# Odaboo Marketplace Database Layer

## Collections
users, roles, sellerProfiles, categories, products, auctions, bids, autoBids, carts, wishlists, orders, payments, refunds, shipments, wallets, walletTransactions, withdrawals, commissions, reviews, conversations, messages, notifications, supportTickets, coupons, banners, pages, auditLogs, settings.

## Embedding
Addresses, seller documents, category attributes, product images/attributes, cart and wishlist items, order items/address snapshots/status history, payment transactions, notification data, and support ticket messages are embedded as specified.

## References
Schemas use ObjectId refs for users, roles, sellers, categories, products, auctions, bids, orders, payments, refunds, shipments, wallets, withdrawals, commissions, reviews, conversations, notifications, tickets, audit actors, and setting updaters.

## Index Review
Indexes cover product listings/search, category filtering, seller products, active and ending auctions, bid history, buyer orders, seller order item lookup, payment lookup, wallet ledger history, conversation messages, notifications, and admin filtering.

## Transactions Required
Use TransactionHelper for placing bids, settlement, checkout, payment settlement, refunds, commission posting, wallet credit/debit, withdrawal approval, and withdrawal settlement. Redis lock hooks are intentionally isolated for future distributed auction locking.

## Scaling Notes
Bids, messages, wallet transactions, notifications, and audit logs are separate collections to avoid unbounded parent arrays. Support messages are embedded now, but the module boundary allows migration to a separate support messages collection later.

## Deviations
No intentional schema deviations. Service implementations are intentionally skeletal except for an example transactional bid path; business workflows should be expanded around the provided schemas and transaction helper.