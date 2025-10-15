import { Models } from "node-appwrite";

export interface Server extends Models.Document {
  name: string;
  region: string;
  flag: string;
}

export interface SteamData extends Models.Document {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  communityvisibilitystate: number;
  lastUpdated: string;
}

export interface SteamBans extends Models.Document {
  steamid: string;
  VACBanned: boolean;
  NumberOfVACBans: number;
  CommunityBanned: boolean;
  NumberOfGameBans: number;
  DaysSinceLastBan: number;
  EconomyBan: string;
  lastUpdated: string;
  $sequence: number;
  // accommodate for inconsistencies from steam api
  NumberOfVacBans?: number;
  vacBans?: number;
  gameBans?: number;
  communityBanned?: boolean;
  economyBan?: string;
}

export interface Player extends Models.Document {
  steamid: string;
  currentName: string;
  nameHistory: string[];
  firstSeen: string;
  lastSeen:string;
  $sequence: number;
}

export interface EnrichedPlayer extends Player {
  steamData?: SteamData | null;
  steamBans?: SteamBans | null;
  lastServer?: {
    serverId: string;
    serverName: string;
    serverRegion: string;
    serverFlag: string;
  } | null;
  votes?: {
    likes: number;
    dislikes: number;
    neutral: number;
    total: number;
    userVote?: string | null;
  };
}


export interface ListPlayer extends Models.Document {
    steamid: string;
    serverId: string;
}

export interface PlayerVote extends Models.Document {
    steamid: string;
    voterId: string;
    voteType: 'like' | 'dislike' | 'neutral';
}