import api from './api';
import { hasSupabaseRealtime, supabase } from './supabase';

export const REALTIME_EVENT_NAME = 'ledger:realtime-change';

const TABLES = [
  'accounts',
  'account_inventory_items',
  'payments',
  'installments',
  'inventory_items',
  'recovery_men',
  'cycle_settings',
];

export function subscribeLedgerRealtime() {
  if (!hasSupabaseRealtime || !supabase) {
    return () => {};
  }

  let dispatchTimer = null;
  const channel = supabase.channel('ledger-realtime');

  const scheduleDispatch = (payload) => {
    api.clearCache?.();
    window.clearTimeout(dispatchTimer);
    dispatchTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(REALTIME_EVENT_NAME, { detail: payload }));
    }, 180);
  };

  TABLES.forEach((table) => {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      (payload) => {
        scheduleDispatch({
          table,
          eventType: payload.eventType,
        });
      },
    );
  });

  channel.subscribe();

  return () => {
    window.clearTimeout(dispatchTimer);
    supabase.removeChannel(channel);
  };
}

export function attachRealtimeRefresh(callback, watchedTables = []) {
  const handler = (event) => {
    const table = event?.detail?.table;
    if (!watchedTables.length || watchedTables.includes(table)) {
      callback(event?.detail);
    }
  };

  window.addEventListener(REALTIME_EVENT_NAME, handler);
  return () => window.removeEventListener(REALTIME_EVENT_NAME, handler);
}
