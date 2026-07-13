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
  return data;
};

export const submitGuess = async (roomId: string, guess: string) => {
  const { data, error } = await supabase
    .rpc("submit_guess", { p_room_id: roomId, p_guess: guess })
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const getMyGuessStatus = async (roomId: string) => {
  const { data, error } = await supabase
    .rpc("get_my_guess_status", { p_room_id: roomId })
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const checkAndAdvanceTurn = async (roomId: string) => {
  const { error } = await supabase.rpc("check_and_advance_turn", {
    p_room_id: roomId,
  });
  if (error) throw new Error(error.message);
};

export const getRoundEndWord = async (roomId: string) => {
  const { data, error } = await supabase.rpc("get_round_end_word", {
    p_room_id: roomId,
  });
  if (error) throw new Error(error.message);
  return data;
};

export const getServerTime = async () => {
  const clientRequestTime = Date.now();
  const { data, error } = await supabase.rpc("get_server_time");
  const clientResponseTime = Date.now();
  if (error) throw new Error(error.message);

  const roundTrip = clientResponseTime - clientRequestTime;
  const serverTime = new Date(data as string).getTime();

  const estimatedServerTimeAtResponseMidpoint = serverTime;
  const offset =
    estimatedServerTimeAtResponseMidpoint - (clientRequestTime + roundTrip / 2);

  return offset;
};
