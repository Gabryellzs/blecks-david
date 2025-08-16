"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

interface UserMenuProps {
  userName: string;
  userAvatarUrl?: string | null;
}

export function UserMenu({ userName, userAvatarUrl }: UserMenuProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const goProfile = () => router.push("/dashboard/profile");

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer hover:ring-2 hover:ring-ring transition-all duration-200">
          <AvatarImage src={userAvatarUrl || "/placeholder-user.jpg"} alt="User Avatar" />
          <AvatarFallback>{userName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={goProfile} className="cursor-pointer">
          <User className="mr-2 h-4 w-4" /> Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" disabled={loggingOut}>
          <LogOut className="mr-2 h-4 w-4" /> {loggingOut ? "Saindo..." : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
