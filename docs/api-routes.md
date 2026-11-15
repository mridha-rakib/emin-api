# API Test Reference

Base URL:

```text
http://localhost:3000
```

All generated create/update endpoints currently accept this wrapper:

```json
{
  "payload": {
    "...": "resource fields"
  }
}
```

List endpoints:

```text
GET /resource?page=1&limit=25
```

List response:

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "pages": 0
  }
}
```

## All Routes

Each resource has:

```text
POST   /resource
GET    /resource?page=1&limit=25
GET    /resource/:id
PATCH  /resource/:id
DELETE /resource/:id
```

| Resource | Route | Delete behavior |
|---|---|---|
| Users | `/users` | Soft delete |
| Roles | `/roles` | Hard delete |
| Seller Profiles | `/seller-profiles` | Soft delete |
| Categories | `/categories` | Hard delete |
| Products | `/products` | Soft delete |
| Auctions | `/auctions` | Hard delete |
| Bids | `/bids` | Blocked |
| Auto Bids | `/auto-bids` | Hard delete |
| Carts | `/carts` | Hard delete |
| Wishlists | `/wishlists` | Hard delete |
| Orders | `/orders` | Blocked |
| Payments | `/payments` | Blocked |
| Refunds | `/refunds` | Blocked |
| Shipments | `/shipments` | Hard delete |
| Wallets | `/wallets` | Hard delete |
| Wallet Transactions | `/wallet-transactions` | Create/update/delete blocked |
| Withdrawals | `/withdrawals` | Blocked |
| Commissions | `/commissions` | Blocked |
| Reviews | `/reviews` | Hard delete |
| Conversations | `/conversations` | Hard delete |
| Messages | `/messages` | Hard delete |
| Notifications | `/notifications` | Hard delete |
| Support Tickets | `/support-tickets` | Hard delete |
| Coupons | `/coupons` | Hard delete |
| Banners | `/banners` | Hard delete |
| Pages | `/pages` | Hard delete |
| Audit Logs | `/audit-logs` | Create/update/delete blocked |
| Settings | `/settings` | Hard delete |
| Bookings | `/bookings` | Hard delete |
| Services | `/services` | Hard delete |
| Blogs | `/blogs` | Hard delete |
| Feed Posts | `/feed-posts` | Hard delete |
| Subscription Plans | `/subscription-plans` | Hard delete |
| Subscriptions | `/subscriptions` | Hard delete |
| Invoices | `/invoices` | Hard delete |
| AI Negotiation Logs | `/ai-negotiation-logs` | Hard delete |
| Platform Customization | `/platform-customization` | Hard delete plus singleton endpoints |
| FAQs | `/faqs` | Hard delete |

Special route:

```text
POST /auctions/:auctionId/bids
```

Dashboard/report routes:

```text
GET /dashboard/summary
GET /reports/summary
GET /earnings/summary
```

Auth routes:

```text
POST  /auth/register
POST  /auth/login
POST  /auth/forgot-password
POST  /auth/verify-otp
POST  /auth/reset-password
PATCH /auth/change-password
GET   /auth/me
```

## Request Bodies

Use real MongoDB ObjectIds from your database. These are examples.

### Users

```http
POST /users
```

```json
{
  "payload": {
    "firstName": "Saif",
    "lastName": "Ahmed",
    "email": "saif@example.com",
    "phone": "+8801700000000",
    "passwordHash": "$2b$10$hashed",
    "roles": ["66f000000000000000000001"],
    "addresses": [
      {
        "fullName": "Saif Ahmed",
        "phone": "+8801700000000",
        "addressLine1": "Road 1",
        "city": "Dhaka",
        "postalCode": "1207",
        "country": "Bangladesh",
        "isDefault": true
      }
    ],
    "status": "ACTIVE"
  }
}
```

### Roles

```http
POST /roles
```

```json
{
  "payload": {
    "name": "Seller",
    "slug": "SELLER",
    "permissions": ["product.create", "product.update", "auction.read"]
  }
}
```

### Seller Profiles

```http
POST /seller-profiles
```

```json
{
  "payload": {
    "userId": "66f000000000000000000002",
    "displayName": "Saif Store",
    "businessName": "Saif Trading",
    "businessType": "individual",
    "verificationStatus": "PENDING",
    "documents": [
      {
        "type": "NID",
        "fileUrl": "https://example.com/nid.pdf",
        "status": "PENDING"
      }
    ]
  }
}
```

### Categories

```http
POST /categories
```

```json
{
  "payload": {
    "parentId": null,
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic items",
    "attributes": [
      {
        "name": "Brand",
        "type": "TEXT",
        "required": false,
        "filterable": true,
        "sortOrder": 1
      }
    ],
    "status": "ACTIVE",
    "sortOrder": 1
  }
}
```

### Products

```http
POST /products
```

```json
{
  "payload": {
    "sellerId": "66f000000000000000000003",
    "categoryId": "66f000000000000000000004",
    "title": "iPhone 15",
    "slug": "iphone-15",
    "description": "Excellent condition",
    "condition": "LIKE_NEW",
    "listingType": "AUCTION_AND_BUY_NOW",
    "price": "900",
    "buyNowPrice": "1000",
    "currency": "USD",
    "quantity": 1,
    "sku": "IPH15-001",
    "images": [
      {
        "url": "https://example.com/iphone.jpg",
        "isPrimary": true,
        "sortOrder": 1
      }
    ],
    "attributes": [
      {
        "attributeId": "66f000000000000000000005",
        "name": "Brand",
        "value": "Apple"
      }
    ],
    "status": "ACTIVE",
    "approvalStatus": "APPROVED"
  }
}
```

### Auctions

```http
POST /auctions
```

```json
{
  "payload": {
    "productId": "66f000000000000000000006",
    "sellerId": "66f000000000000000000003",
    "startPrice": "100",
    "reservePrice": "500",
    "buyNowPrice": "1000",
    "currentPrice": "100",
    "minimumIncrement": "10",
    "startAt": "2026-09-26T10:00:00.000Z",
    "endAt": "2026-09-30T10:00:00.000Z",
    "status": "ACTIVE",
    "autoExtendEnabled": true
  }
}
```

### Place Bid

Use this endpoint for auction bidding:

```http
POST /auctions/66f000000000000000000010/bids
```

```json
{
  "bidderId": "66f000000000000000000002",
  "amount": "125.50"
}
```

### Direct Bids

```http
POST /bids
```

```json
{
  "payload": {
    "auctionId": "66f000000000000000000010",
    "bidderId": "66f000000000000000000002",
    "amount": "150",
    "type": "MANUAL",
    "status": "VALID"
  }
}
```

### Auto Bids

```http
POST /auto-bids
```

```json
{
  "payload": {
    "auctionId": "66f000000000000000000010",
    "userId": "66f000000000000000000002",
    "maxAmount": "500",
    "currentAmount": "150",
    "active": true
  }
}
```

### Carts

```http
POST /carts
```

```json
{
  "payload": {
    "userId": "66f000000000000000000002",
    "items": [
      {
        "productId": "66f000000000000000000006",
        "quantity": 2,
        "addedAt": "2026-09-26T10:00:00.000Z"
      }
    ]
  }
}
```

### Wishlists

```http
POST /wishlists
```

```json
{
  "payload": {
    "userId": "66f000000000000000000002",
    "items": [
      {
        "productId": "66f000000000000000000006",
        "addedAt": "2026-09-26T10:00:00.000Z"
      }
    ]
  }
}
```

### Orders

```http
POST /orders
```

```json
{
  "payload": {
    "orderNumber": "ORD-1001",
    "buyerId": "66f000000000000000000002",
    "items": [
      {
        "productId": "66f000000000000000000006",
        "sellerId": "66f000000000000000000003",
        "auctionId": "66f000000000000000000010",
        "productSnapshot": {
          "title": "iPhone 15",
          "image": "https://example.com/iphone.jpg",
          "sku": "IPH15-001",
          "condition": "LIKE_NEW"
        },
        "quantity": 1,
        "unitPrice": "900",
        "subtotal": "900",
        "commissionAmount": "90",
        "sellerNetAmount": "810"
      }
    ],
    "shippingAddress": {
      "fullName": "Saif Ahmed",
      "phone": "+8801700000000",
      "addressLine1": "Road 1",
      "city": "Dhaka",
      "postalCode": "1207",
      "country": "Bangladesh"
    },
    "amounts": {
      "subtotal": "900",
      "shipping": "20",
      "tax": "0",
      "discount": "0",
      "total": "920"
    },
    "currency": "USD",
    "paymentStatus": "PENDING",
    "orderStatus": "PENDING",
    "fulfillmentStatus": "UNFULFILLED"
  }
}
```

### Payments

```http
POST /payments
```

```json
{
  "payload": {
    "orderId": "66f000000000000000000020",
    "userId": "66f000000000000000000002",
    "provider": "stripe",
    "providerPaymentId": "pi_test_123",
    "amount": "920",
    "currency": "USD",
    "paymentMethod": "card",
    "status": "PENDING",
    "transactions": []
  }
}
```

### Refunds

```http
POST /refunds
```

```json
{
  "payload": {
    "orderId": "66f000000000000000000020",
    "paymentId": "66f000000000000000000021",
    "requestedBy": "66f000000000000000000002",
    "amount": "100",
    "reason": "Customer request",
    "status": "PENDING"
  }
}
```

### Shipments

```http
POST /shipments
```

```json
{
  "payload": {
    "orderId": "66f000000000000000000020",
    "sellerId": "66f000000000000000000003",
    "itemIds": ["66f000000000000000000030"],
    "carrier": "DHL",
    "service": "Express",
    "trackingNumber": "DHL123",
    "status": "READY"
  }
}
```

### Wallets

```http
POST /wallets
```

```json
{
  "payload": {
    "sellerId": "66f000000000000000000003",
    "currency": "USD",
    "availableBalance": "0",
    "pendingBalance": "0"
  }
}
```

### Wallet Transactions

Create/update/delete is blocked. Test reads only:

```http
GET /wallet-transactions
GET /wallet-transactions/:id
```

### Withdrawals

```http
POST /withdrawals
```

```json
{
  "payload": {
    "sellerId": "66f000000000000000000003",
    "walletId": "66f000000000000000000040",
    "amount": "50",
    "currency": "USD",
    "payoutMethod": "bank",
    "payoutDetails": {
      "accountLast4": "1234"
    },
    "status": "PENDING"
  }
}
```

### Commissions

```http
POST /commissions
```

```json
{
  "payload": {
    "orderId": "66f000000000000000000020",
    "orderItemId": "66f000000000000000000030",
    "sellerId": "66f000000000000000000003",
    "grossAmount": "900",
    "commissionRate": "10",
    "commissionAmount": "90",
    "sellerNetAmount": "810",
    "status": "CALCULATED"
  }
}
```

### Reviews

```http
POST /reviews
```

```json
{
  "payload": {
    "orderId": "66f000000000000000000020",
    "productId": "66f000000000000000000006",
    "sellerId": "66f000000000000000000003",
    "reviewerId": "66f000000000000000000002",
    "rating": 5,
    "title": "Great product",
    "comment": "Exactly as described",
    "status": "PUBLISHED"
  }
}
```

### Conversations

```http
POST /conversations
```

```json
{
  "payload": {
    "participants": ["66f000000000000000000002", "66f000000000000000000003"],
    "productId": "66f000000000000000000006",
    "lastMessage": {
      "text": "Is this available?",
      "senderId": "66f000000000000000000002",
      "createdAt": "2026-09-26T10:00:00.000Z"
    }
  }
}
```

### Messages

```http
POST /messages
```

```json
{
  "payload": {
    "conversationId": "66f000000000000000000050",
    "senderId": "66f000000000000000000002",
    "text": "Is this available?",
    "attachments": [],
    "readBy": []
  }
}
```

### Notifications

```http
POST /notifications
```

```json
{
  "payload": {
    "userId": "66f000000000000000000002",
    "type": "ORDER_CREATED",
    "title": "Order created",
    "body": "Your order has been created.",
    "data": {
      "orderId": "66f000000000000000000020"
    },
    "channel": "IN_APP"
  }
}
```

### Support Tickets

```http
POST /support-tickets
```

```json
{
  "payload": {
    "ticketNumber": "TCK-1001",
    "userId": "66f000000000000000000002",
    "orderId": "66f000000000000000000020",
    "subject": "Order issue",
    "category": "ORDER",
    "priority": "NORMAL",
    "status": "OPEN",
    "messages": [
      {
        "senderId": "66f000000000000000000002",
        "message": "I need help with this order.",
        "attachments": []
      }
    ]
  }
}
```

### Coupons

```http
POST /coupons
```

```json
{
  "payload": {
    "code": "WELCOME10",
    "discountType": "PERCENTAGE",
    "discountValue": "10",
    "minimumOrderAmount": "50",
    "maximumDiscountAmount": "25",
    "usageLimit": 1000,
    "usagePerUser": 1,
    "active": true
  }
}
```

### Banners

```http
POST /banners
```

```json
{
  "payload": {
    "title": "Home Hero",
    "desktopImageUrl": "https://example.com/banner-desktop.jpg",
    "mobileImageUrl": "https://example.com/banner-mobile.jpg",
    "targetUrl": "/products",
    "placement": "home-hero",
    "sortOrder": 1,
    "active": true
  }
}
```

### Pages

```http
POST /pages
```

```json
{
  "payload": {
    "title": "About Us",
    "slug": "about-us",
    "content": {
      "blocks": []
    },
    "seoTitle": "About Odaboo",
    "seoDescription": "About the marketplace",
    "status": "PUBLISHED"
  }
}
```

### Audit Logs

Create/update/delete is blocked. Test reads only:

```http
GET /audit-logs
GET /audit-logs/:id
```

### Settings

```http
POST /settings
```

```json
{
  "payload": {
    "key": "platform.currency",
    "value": "USD",
    "description": "Default platform currency",
    "updatedBy": "66f000000000000000000001"
  }
}
```

### Bookings

```http
POST /bookings
```

```json
{
  "payload": {
    "customerName": "Saif Ahmed",
    "customerEmail": "saif@example.com",
    "customerPhone": "+8801700000000",
    "customerId": "66f000000000000000000002",
    "providerId": "66f000000000000000000003",
    "serviceId": "66f000000000000000000006",
    "serviceTitle": "AI Product Photography",
    "serviceCategory": "Design",
    "scheduledAt": "2026-09-30T10:00:00.000Z",
    "location": "Dhaka",
    "amount": "120",
    "currency": "USD",
    "status": "pending"
  }
}
```

### Services

```http
POST /services
```

```json
{
  "payload": {
    "providerId": "66f000000000000000000003",
    "title": "AI Product Photography",
    "slug": "ai-product-photography",
    "description": "Studio quality AI-enhanced product images.",
    "category": "Design",
    "tags": ["ai", "photography"],
    "price": "120",
    "currency": "USD",
    "images": ["https://example.com/service.jpg"],
    "status": "ACTIVE"
  }
}
```

### Blogs

```http
POST /blogs
```

```json
{
  "payload": {
    "title": "Marketplace Trends",
    "slug": "marketplace-trends",
    "excerpt": "What is changing in commerce.",
    "content": "<p>Long form content...</p>",
    "coverImage": "https://example.com/blog.jpg",
    "authorId": "66f000000000000000000001",
    "tags": ["marketplace"],
    "status": "PUBLISHED",
    "publishedAt": "2026-09-26T00:00:00.000Z"
  }
}
```

### Feed Posts

```http
POST /feed-posts
```

```json
{
  "payload": {
    "userId": "66f000000000000000000002",
    "title": "Need a product demo video",
    "description": "Looking for a short video editor.",
    "category": "Video",
    "budget": "200",
    "location": "Remote",
    "attachments": [],
    "status": "OPEN"
  }
}
```

### Subscription Plans

```http
POST /subscription-plans
```

```json
{
  "payload": {
    "name": "Pro",
    "slug": "pro",
    "monthlyPrice": "19",
    "yearlyPrice": "190",
    "currency": "USD",
    "features": ["More listings", "AI negotiator"],
    "active": true
  }
}
```

### Subscriptions

```http
POST /subscriptions
```

```json
{
  "payload": {
    "userId": "66f000000000000000000002",
    "planId": "66f000000000000000000070",
    "planName": "Pro",
    "billingCycle": "monthly",
    "amount": "19",
    "currency": "USD",
    "status": "ACTIVE",
    "startsAt": "2026-09-26T00:00:00.000Z"
  }
}
```

### Invoices

```http
POST /invoices
```

```json
{
  "payload": {
    "invoiceNumber": "INV-1001",
    "userId": "66f000000000000000000002",
    "subscriptionId": "66f000000000000000000071",
    "amount": "19",
    "currency": "USD",
    "status": "PAID",
    "paidAt": "2026-09-26T00:00:00.000Z"
  }
}
```

### AI Negotiation Logs

```http
POST /ai-negotiation-logs
```

```json
{
  "payload": {
    "productId": "66f000000000000000000006",
    "buyerId": "66f000000000000000000002",
    "sellerId": "66f000000000000000000003",
    "offerAmount": "700",
    "counterAmount": "760",
    "status": "COUNTERED",
    "messages": [
      {
        "role": "buyer",
        "content": "Can you do 700?"
      }
    ]
  }
}
```

### Platform Customization

```http
PATCH /platform-customization/default
```

```json
{
  "payload": {
    "logoUrl": "https://example.com/logo.png",
    "primaryColor": "#1eb9c7",
    "supportEmail": "support@example.com",
    "branding": {
      "siteName": "Odaboo"
    },
    "aiRules": {
      "maxDiscountPercent": 15
    }
  }
}
```

Read singleton:

```http
GET /platform-customization/default
```

### FAQs

```http
POST /faqs
```

```json
{
  "payload": {
    "question": "How do I become verified?",
    "answer": "Complete your profile and submit documents.",
    "category": "For Professionals",
    "sortOrder": 1,
    "active": true
  }
}
```

## Auth Request Bodies

### Register

```http
POST /auth/register
```

```json
{
  "firstName": "Saif",
  "lastName": "Ahmed",
  "email": "saif@example.com",
  "phone": "+8801700000000",
  "password": "secret123"
}
```

### Login

```http
POST /auth/login
```

```json
{
  "email": "saif@example.com",
  "password": "secret123"
}
```

### Forgot Password

```http
POST /auth/forgot-password
```

```json
{
  "email": "saif@example.com"
}
```

### Verify OTP

```http
POST /auth/verify-otp
```

```json
{
  "email": "saif@example.com",
  "otp": "123456"
}
```

### Reset Password

```http
POST /auth/reset-password
```

```json
{
  "email": "saif@example.com",
  "otp": "123456",
  "password": "newSecret123"
}
```

### Change Password

```http
PATCH /auth/change-password
```

```json
{
  "currentPassword": "secret123",
  "newPassword": "newSecret123"
}
```

## Example Update

```http
PATCH /products/:id
```

```json
{
  "payload": {
    "status": "INACTIVE"
  }
}
```

## Example Responses

Create/detail response:

```json
{
  "_id": "66f000000000000000000006",
  "title": "iPhone 15",
  "status": "ACTIVE",
  "createdAt": "2026-09-26T00:00:00.000Z",
  "updatedAt": "2026-09-26T00:00:00.000Z"
}
```

Update response:

```json
{
  "_id": "66f000000000000000000006",
  "status": "INACTIVE",
  "updatedAt": "2026-09-26T00:00:00.000Z"
}
```

Delete response:

```json
{
  "acknowledged": true,
  "deletedCount": 1
}
```

Soft delete response:

```json
{
  "_id": "66f000000000000000000006",
  "deletedAt": "2026-09-26T00:00:00.000Z"
}
```

Invalid ObjectId:

```json
{
  "statusCode": 400,
  "message": "Invalid ObjectId",
  "error": "Bad Request"
}
```

Blocked operation:

```json
{
  "statusCode": 405,
  "message": "Commission records cannot be deleted.",
  "error": "Method Not Allowed"
}
```

Duplicate unique key currently returns Nest's default `500 Internal server error`. Add a Mongo exception filter later to convert duplicate keys to `409 Conflict`.
