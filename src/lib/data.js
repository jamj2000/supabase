'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";


export async function getTodos() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: todos } = await supabase.from("todos").select();
    return todos;
}
