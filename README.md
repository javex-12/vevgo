# Vevgo Grocery

Vevgo Grocery is a grocery ordering prototype I built to show how a customer
places an order, and how the vendor and rider handle it from start to finish.

## Features

**Customer**

- Browse products, search and filter by category.
- Add to the cart and change quantities.
- Check out with delivery details.
- Track the order and watch its status.

**Vendor** (`/admin`)

- See incoming orders.
- Accept them and move them along as they're prepared.
- Mark them ready for pickup.

**Rider** (`/rider`)

- See the orders that are ready for pickup.
- Accept a delivery.
- Update the status until it's delivered.

## Built with

- Next.js
- React
- TypeScript
- Tailwind CSS
- SQLite / libSQL

## Getting started

```bash
git clone https://github.com/javex-12/vevgo.git
cd vevgo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You'll need
Node.js 20.9 or newer. The product catalogue is seeded the first time you run it.

## How it works

The customer picks products, adds them to the cart and submits the order with a
delivery address.

The order is saved and shows up on the vendor dashboard. The vendor accepts it,
prepares it and marks it ready for pickup.

A rider sees it on their board, accepts the delivery and updates the status as
it goes.

The customer follows all of it from the order page.

## Rider notifications

For this prototype, the rider board checks for ready orders every five seconds
while the page is open.

In production, Firebase Cloud Messaging (FCM) could send a push notification to
riders the moment an order is ready, even with the dashboard closed.

## Running the production build

```bash
npm run build
npm run start
```
