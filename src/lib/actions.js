'use server'

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";



export async function addTodo(formData) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const todo = formData.get("new-todo");
    if (!todo) return;

    const { error } = await supabase.from("todos").insert({ name: todo });
    if (error) {
        console.error("Error adding todo:", error);
    }
    revalidatePath("/");
}


export async function removeTodo(formData) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const id = parseInt(formData.get("id"));
    if (!id) return;

    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
        console.error("Error removing todo:", error);
    }
    revalidatePath("/");
}