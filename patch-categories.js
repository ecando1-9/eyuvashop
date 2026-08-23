const { createClient } = require('@supabase/supabase-js');

const url = 'https://yllkllscrxgqwtcpxnyw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsbGtsbHNjcnhncXd0Y3B4bnl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg4NDc1NSwiZXhwIjoyMDg4NDYwNzU1fQ.oIdQBWvlEPN1ioSxZCPiODh3kHfdpHD6d9vtrSp05VQ';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from('categories')
    .update({ type: 'PLATFORM' })
    .eq('type', 'MERCHANT');
    
  if (error) {
    console.error('Error updating categories:', error);
  } else {
    console.log('Successfully updated merchant categories to PLATFORM!');
  }
}

run();
