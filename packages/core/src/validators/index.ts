import { z } from 'zod';

export const JoinRoomSchema = z.object({
  roomId: z.string().min(1),
  name: z.string().min(1).max(50),
});

export const CastVoteSchema = z.object({
  roomId: z.string().min(1),
  value: z.string().min(1),
});

export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;
export type CastVoteInput = z.infer<typeof CastVoteSchema>;
