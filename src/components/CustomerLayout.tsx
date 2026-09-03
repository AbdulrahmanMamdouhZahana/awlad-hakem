import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function CustomerLayout() {
  return (
    <div className="min-h-screen bg-[#fafafc]">
      <Navbar />

      <main>
        <Outlet />
      </main>
    </div>
  );
}