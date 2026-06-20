import Dexie, { type Table } from "dexie";

/**
 * Offline round — stored locally when user scores without connectivity.
 */
export interface OfflineRound {
  offlineId: string; // client-generated UUID
  serverId?: string; // set once synced
  courseId: string;
  courseName: string;
  teeSetId?: string;
  tournamentId?: string;
  date: string;
  status: "in_progress" | "completed";
  createdAt: string;
  synced: 0 | 1; // 0 = pending, 1 = synced
}

/**
 * Offline hole score — stored locally per hole.
 */
export interface OfflineHoleScore {
  id?: number; // auto-increment
  offlineRoundId: string; // FK to OfflineRound.offlineId
  holeNumber: number;
  strokes: number;
  putts: number;
  penalties: number;
  fairwayHit?: string;
  greenInRegulation?: boolean;
  synced: 0 | 1;
}

/**
 * Offline shot — stored locally per shot.
 */
export interface OfflineShot {
  id?: number;
  offlineRoundId: string;
  holeNumber: number;
  shotNumber: number;
  club?: string;
  lieType?: string;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  distanceYards?: number;
  synced: 0 | 1;
}

/**
 * Cached course data for offline use.
 */
export interface OfflineCourse {
  id: string; // server course ID
  name: string;
  numHoles: number;
  lat?: number;
  lng?: number;
  cachedAt: string;
  holes: {
    id: string;
    holeNumber: number;
    par: number;
    yardage?: number;
    handicapIndex?: number;
  }[];
}

/**
 * Offline sync queue — generic action queue for deferred operations.
 */
export interface OfflineAction {
  id?: number;
  type: string; // e.g. "save_score", "complete_round"
  payload: string; // JSON stringified
  createdAt: string;
  retries: number;
  status: "pending" | "syncing" | "failed";
}

class GolfAppDB extends Dexie {
  rounds!: Table<OfflineRound, string>;
  holeScores!: Table<OfflineHoleScore, number>;
  shots!: Table<OfflineShot, number>;
  courses!: Table<OfflineCourse, string>;
  actions!: Table<OfflineAction, number>;

  constructor() {
    super("GolfAppDB");

    this.version(1).stores({
      rounds: "offlineId, serverId, courseId, synced, createdAt",
      holeScores: "++id, offlineRoundId, holeNumber, synced, [offlineRoundId+holeNumber]",
      shots: "++id, offlineRoundId, holeNumber, synced",
      courses: "id, name, cachedAt",
      actions: "++id, type, status, createdAt",
    });
  }
}

export const db = new GolfAppDB();
