
import { getTodos } from "@/lib/data";
import { addTodo, removeTodo } from "@/lib/actions";



const Add = () => (
  <form action={addTodo} className="inline-block text-green-500 border-green-500 border-[2px] px-[4px] rounded">
    <input
      type="text"
      placeholder="Add a new todo"
      name="new-todo"
    />
    <button>Add</button>
  </form>
)



const Remove = ({ id }) => (
  <form action={removeTodo} className="inline-block text-red-500 border-red-500 border-[2px] px-[4px] rounded">
    <input
      type="hidden"
      name="id"
      value={id}
    />
    <button>Remove</button>
  </form>
)



export default async function Page() {
  const todos = await getTodos();


  return (
    <div>
      <Add />

      <ul>
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name} <Remove id={todo.id} /></li>
        ))}
      </ul>
    </div>
  );
}
