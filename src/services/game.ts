import { supabase } from "@/utils/supabase";

export const getGameState = async (roomId: string) => {
  const { data, error } = await supabase
    .rpc("get_game_state", { p_room_id: roomId })
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const startGame = async (roomId: string) => {
  const { error } = await supabase.rpc("start_game", { p_room_id: roomId });
  if (error) throw new Error(error.message);
};

export const getMyWord = async (roomId: string) => {
  const { data, error } = await supabase.rpc("get_my_word", {
    p_room_id: roomId,
  });
  if (error) throw new Error(error.message);
  return data as string;
};
