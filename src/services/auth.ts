import { supabase } from "@/utils/supabase";
import { getRandomUserNumHash } from "@/utils/user";

export const signInAnonymously = () =>
  supabase.auth.signInAnonymously({
    options: { data: { display_name: "Anon#" + getRandomUserNumHash() } },
  });

export const getSession = () => supabase.auth.getSession();

export const changeDisplayName = (displayName: string) =>
  supabase.auth.updateUser({
    data: { display_name: `${displayName}#${getRandomUserNumHash()}` },
  });
