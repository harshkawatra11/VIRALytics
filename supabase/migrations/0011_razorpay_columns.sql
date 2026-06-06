-- Rename payment columns from Stripe → Razorpay
alter table public.managers
  rename column stripe_customer_id to razorpay_customer_id;

alter table public.managers
  rename column stripe_subscription_id to razorpay_subscription_id;

comment on column public.managers.razorpay_customer_id is 'Razorpay customer ID';
comment on column public.managers.razorpay_subscription_id is 'Active Razorpay subscription ID';
