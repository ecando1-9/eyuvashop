
const { createClient } = require("@supabase/supabase-js");

const url = "https://yllkllscrxgqwtcpxnyw.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
    console.error("No service key");
    process.exit(1);
}

const supabase = createClient(url, key);

async function fix() {
    const { data, error } = await supabase
        .from("stores")
        .update({ is_active: true })
        .is("is_active", false);
        // also where is_active is null maybe?

    const { data: data2, error: error2 } = await supabase
        .from("stores")
        .update({ is_active: true })
        .is("is_active", null);

    console.log("Fixed false stores:", error || "success");
    console.log("Fixed null stores:", error2 || "success");
}

fix();

