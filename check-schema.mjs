import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://yllkllscrxgqwtcpxnyw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsbGtsbHNjcnhncXd0Y3B4bnl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg4NDc1NSwiZXhwIjoyMDg4NDYwNzU1fQ.oIdQBWvlEPN1ioSxZCPiODh3kHfdpHD6d9vtrSp05VQ'
);

async function main() {
    const { data, error } = await supabase.rpc('get_schema_columns', {}); // Usually this doesn't exist unless defined.
    // We can query the information_schema via a standard select if accessible directly.
    // Actually, standard service_role cannot query information_schema.columns directly unless via rpc.

    // Let's just create a new product and see what columns exist.
    const { data: p, error: e } = await supabase.from('products').select('*').limit(1);
    console.log('Product row:', p, e);
}

main().catch(console.error);
