# Database Setup for Transparenztool

This guide will help you set up the required database tables in Supabase.

## Orders Table

Run this SQL in your Supabase SQL Editor (Database → SQL Editor):

```sql
-- Create orders table
create table orders (
  id uuid default gen_random_uuid() primary key,
  order_number text unique not null,
  user_id uuid references auth.users on delete cascade not null,
  farmer_name text not null,
  status text not null default 'Announced',
  items jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table orders enable row level security;

-- Policy: Users can view their own orders
create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

-- Policy: Users can insert their own orders
create policy "Users can insert own orders"
  on orders for insert
  with check (auth.uid() = user_id);

-- Policy: Users can update their own orders
create policy "Users can update own orders"
  on orders for update
  using (auth.uid() = user_id);

-- Policy: Users can delete their own orders
create policy "Users can delete own orders"
  on orders for delete
  using (auth.uid() = user_id);

-- Policy: Logistics users can view all orders
create policy "Logistics can view all orders"
  on orders for select
  using (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  );

-- Policy: Logistics users can update order status to Accepted
create policy "Logistics can accept orders"
  on orders for update
  using (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  )
  with check (
    status = 'Accepted' or status = 'Delivered'
  );

-- Create index for faster queries
create index orders_user_id_idx on orders(user_id);
create index orders_created_at_idx on orders(created_at desc);
create index orders_status_idx on orders(status);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at_column();
```

## Storage Table

Run this SQL to create the storage table for tracking vegetable inventory:

```sql
-- Create storage table
create table storage (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references orders on delete cascade not null,
  order_number text not null,
  farmer_name text not null,
  vegetable text not null,
  quantity integer not null,
  accepted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table storage enable row level security;

-- Policy: Logistics users can view all storage entries
create policy "Logistics can view all storage"
  on storage for select
  using (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  );

-- Policy: Logistics users can insert storage entries
create policy "Logistics can insert storage"
  on storage for insert
  with check (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  );

-- Policy: Produzenten can view their own storage entries
create policy "Produzenten can view own storage"
  on storage for select
  using (
    exists (
      select 1 from orders
      where orders.id = storage.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Create indexes for faster queries
create index storage_order_id_idx on storage(order_id);
create index storage_vegetable_idx on storage(vegetable);
create index storage_accepted_at_idx on storage(accepted_at desc);
```

## Order Items Structure

The `items` field is a JSONB array containing objects with this structure:

```json
[
  {
    "vegetable": "Tomatoes",
    "quantity": 100
  },
  {
    "vegetable": "Carrots",
    "quantity": 50
  }
]
```

## Order Statuses

- **Announced** - Order has been created and submitted (Produzenten)
- **Delivered** - Order has been delivered (Produzenten)
- **Accepted** - Order has been accepted by logistics (Logistics)
- **Stored** - (Future) Order has been stored in warehouse

## Testing the Setup

After running the SQL, you can test with:

```sql
-- Insert a test order
insert into orders (order_number, user_id, farmer_name, items)
values (
  'ORD-2024-001',
  auth.uid(),
  'Test Produzent',
  '[{"vegetable": "Tomatoes", "quantity": 100}]'::jsonb
);

-- Query your orders
select * from orders where user_id = auth.uid();
```

## Next Steps

1. Run the SQL script in Supabase SQL Editor
2. Verify the table was created in Table Editor
3. Test creating an order through the app
4. Check the data in Supabase Table Editor
