import { haySesion } from "@/lib/auth";
import { listarProductos } from "@/lib/db";
import Login from "./login";
import Nevera from "./nevera";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!(await haySesion())) return <Login />;
  const productos = await listarProductos();
  return <Nevera inicial={productos} />;
}
