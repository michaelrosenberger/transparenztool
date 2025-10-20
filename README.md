# Transparenztool 🌾

A modern supply chain transparency platform built with Next.js and Supabase, enabling farmers, logistics partners, and end users to track agricultural products from farm to table.

## Features

### 👨‍🌾 Farmer Dashboard
- **Order Management**: Create, view, and manage delivery orders
- **Status Tracking**: Update order status from Announced → Delivered
- **Order History**: View all past and current orders
- **Vegetable Selection**: Choose from 10+ vegetable types with quantity sliders

### 🚚 Logistics Dashboard
- **Storage Inventory**: Real-time view of all vegetables in storage with quantities
- **Delivered Orders**: Review and accept orders delivered by farmers
- **Accepted Orders**: View read-only list of processed orders
- **Order Details**: Complete overview of farmer info, items, and quantities
- **Accept Orders**: One-click acceptance that automatically adds items to storage

### 🛒 End User Dashboard
- Coming soon: Product tracking and transparency features

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- Git (for deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd transparenztool
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project settings:
- Go to **Project Settings** → **API**
- Copy the **Project URL** and **anon/public key**

### 4. Set Up Database

Run the SQL scripts in your Supabase SQL Editor:

1. **Create Orders Table**: See `DATABASE_SETUP.md`
2. **Create Storage Table**: See `DATABASE_SETUP.md`

The setup includes:
- Orders table with RLS policies
- Storage table for inventory tracking
- Indexes for optimized queries
- Automatic timestamp updates

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Roles

The app supports three user types (set during registration):

- **Farmer**: Create and manage delivery orders
- **Logistik**: Accept deliveries and manage storage inventory
- **Enduser**: Track product transparency (coming soon)

## Project Structure

```
transparenztool/
├── app/
│   ├── components/          # Reusable components (Header, Card)
│   ├── farmer/             # Farmer dashboard and order pages
│   ├── logistik/           # Logistics dashboard and order management
│   ├── enduser/            # End user dashboard
│   ├── login/              # Authentication pages
│   ├── register/
│   └── profile/            # User profile settings
├── lib/
│   └── supabase/           # Supabase client configuration
├── public/                 # Static assets (logo, icons)
└── DATABASE_SETUP.md       # Database schema and setup instructions
```

## Key Features Explained

### Order Flow

1. **Farmer** creates an order with vegetables and quantities
2. **Farmer** marks order as "Delivered"
3. **Logistics** reviews the delivered order
4. **Logistics** accepts the order
5. Each vegetable is automatically added to storage inventory
6. Order status changes to "Accepted" (read-only)

### Storage Inventory

- Automatically aggregates all vegetables by type
- Shows total quantities in kg
- Updates in real-time when orders are accepted
- Displays on logistics dashboard

### Security

- Row Level Security (RLS) policies on all tables
- Users can only view/edit their own orders
- Logistics can view all orders but only update status
- Authentication required for all protected routes

## Deployment

### Deploy to Vercel

#### Option 1: GitHub Integration (Recommended)

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click **"Deploy"**

#### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Post-Deployment

Update your Supabase project settings:

1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## Database Schema

### Orders Table
- `id`: UUID (primary key)
- `order_number`: Unique order identifier
- `user_id`: Reference to farmer
- `farmer_name`: Name of the farmer
- `status`: Order status (Announced, Delivered, Accepted)
- `items`: JSONB array of vegetables and quantities
- `created_at`, `updated_at`: Timestamps

### Storage Table
- `id`: UUID (primary key)
- `order_id`: Reference to order
- `order_number`: Order identifier
- `farmer_name`: Name of the farmer
- `vegetable`: Vegetable type
- `quantity`: Amount in kg
- `accepted_at`, `created_at`: Timestamps

## Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues or questions, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js and Supabase
