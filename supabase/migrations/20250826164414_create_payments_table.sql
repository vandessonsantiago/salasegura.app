create table public.payments (
  id uuid default gen_random_uuid() primary key,
  asaas_id text not null,
  status text not null,
  valor numeric,
  user_id text references public.users(id),
  agendamento_id text references public.agendamentos(id),
  created_at timestamp default now()
);
