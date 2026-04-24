import {
  PetBorn as PetBornEvent,
  PetFed as PetFedEvent,
  FocusSessionRecorded as FocusSessionRecordedEvent,
  NamesUpdated as NamesUpdatedEvent,
  UserDeleted as UserDeletedEvent,
  FocusPet,
} from "../generated/FocusPet/FocusPet";
import { User, GlobalStats, DailyActivity } from "../generated/schema";
import { BigInt, Address } from "@graphprotocol/graph-ts";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** ASCII-safe toLowerCase for usernames (A-Z → a-z, rest unchanged). */
function toLower(s: string): string {
  let result = "";
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c >= 65 && c <= 90) {
      result += String.fromCharCode(c + 32);
    } else {
      result += String.fromCharCode(c);
    }
  }
  return result;
}

function getOrCreateUser(address: Address): User {
  let id = address.toHexString();
  let user = User.load(id);
  if (user == null) {
    user = new User(id);
    user.address = address;
    user.username = "";
    user.usernameLower = "";
    user.petName = "";
    user.petNameLower = "";
    user.xp = BigInt.fromI32(0);
    user.health = BigInt.fromI32(0);
    user.streak = BigInt.fromI32(0);
    user.totalFocusTime = BigInt.fromI32(0);
    user.totalDonated = BigInt.fromI32(0);
    user.birthTime = BigInt.fromI32(0);
    user.lastInteraction = BigInt.fromI32(0);
    user.boostEndTime = BigInt.fromI32(0);
    user.shieldCount = BigInt.fromI32(0);
    user.activeCosmetic = "";
    user.totalSessions = BigInt.fromI32(0);
    user.isActive = true;
    user.lastUpdatedBlock = BigInt.fromI32(0);
    user.lastUpdatedAt = BigInt.fromI32(0);
  }
  return user as User;
}

function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("global");
  if (stats == null) {
    stats = new GlobalStats("global");
    stats.totalUsers = BigInt.fromI32(0);
  }
  return stats as GlobalStats;
}

/**
 * Reads the full Pet struct from the contract at the current block.
 * This gives us fields not present in any event (streak, totalFocusTime,
 * totalDonated, boostEndTime, shieldCount, activeCosmetic).
 * Uses try_ to avoid reverting the entire handler on failure.
 */
function syncFromContract(user: User, contractAddress: Address): void {
  let contract = FocusPet.bind(contractAddress);
  let result = contract.try_pets(Address.fromBytes(user.address));
  if (result.reverted) return;

  let pet = result.value;
  user.xp = pet.value0;
  user.health = pet.value1;
  user.lastInteraction = pet.value2;
  user.birthTime = pet.value3;
  // value4 (username) and value5 (petName) are set from events to avoid
  // overwriting with potentially stale contract data during same-block events.
  user.streak = pet.value6;
  // value7 = lastDailySession — not stored in schema
  user.boostEndTime = pet.value8;
  user.shieldCount = pet.value9;
  user.activeCosmetic = pet.value10;
  user.totalDonated = pet.value11;
  user.totalFocusTime = pet.value12;
}

/**
 * Upserts a DailyActivity snapshot for the given user at the block's UTC day.
 * Called after syncFromContract so user.xp / user.totalFocusTime are current.
 */
function upsertDailyActivity(user: User, blockTimestamp: BigInt): void {
  const DAY = BigInt.fromI32(86400);
  const dayTimestamp = blockTimestamp.div(DAY).times(DAY);
  const id = user.id + "-" + dayTimestamp.toString();

  let activity = DailyActivity.load(id);
  if (activity == null) {
    activity = new DailyActivity(id);
    activity.user = user.id;
    activity.date = dayTimestamp;
  }

  activity.xp = user.xp;
  activity.focusTime = user.totalFocusTime;
  activity.lastUpdatedAt = blockTimestamp;
  activity.save();
}

// ─── Event Handlers ─────────────────────────────────────────────────────────

export function handlePetBorn(event: PetBornEvent): void {
  let user = getOrCreateUser(event.params.owner);
  user.isActive = true;
  user.lastUpdatedBlock = event.block.number;
  user.lastUpdatedAt = event.block.timestamp;
  syncFromContract(user, event.address);
  user.save();

  let stats = getOrCreateGlobalStats();
  stats.totalUsers = stats.totalUsers.plus(BigInt.fromI32(1));
  stats.save();
}

export function handlePetFed(event: PetFedEvent): void {
  let user = getOrCreateUser(event.params.owner);

  // Write event values first — these are authoritative for this block.
  user.xp = event.params.newXp;
  user.health = event.params.newHealth;
  user.isActive = true;
  user.lastUpdatedBlock = event.block.number;
  user.lastUpdatedAt = event.block.timestamp;

  // Sync the rest of the Pet struct (streak, totalFocusTime, etc.).
  // syncFromContract will also overwrite xp/health with contract values,
  // which are identical at this block — safe to do.
  syncFromContract(user, event.address);
  upsertDailyActivity(user, event.block.timestamp);

  user.save();
}

export function handleFocusSessionRecorded(event: FocusSessionRecordedEvent): void {
  let user = getOrCreateUser(event.params.owner);
  user.totalSessions = user.totalSessions.plus(BigInt.fromI32(1));
  user.totalFocusTime = event.params.newTotalFocusTime;
  user.streak = event.params.streak;
  user.health = event.params.newHealth;
  user.isActive = true;
  user.lastUpdatedBlock = event.block.number;
  user.lastUpdatedAt = event.block.timestamp;
  upsertDailyActivity(user, event.block.timestamp);
  user.save();
}

export function handleNamesUpdated(event: NamesUpdatedEvent): void {
  let user = getOrCreateUser(event.params.owner);

  user.username = event.params.username;
  user.usernameLower = toLower(event.params.username);
  user.petName = event.params.petName;
  user.petNameLower = toLower(event.params.petName);
  user.isActive = true;
  user.lastUpdatedBlock = event.block.number;
  user.lastUpdatedAt = event.block.timestamp;

  user.save();
}

export function handleUserDeleted(event: UserDeletedEvent): void {
  let id = event.params.owner.toHexString();
  let user = User.load(id);

  // If somehow we never saw a PetBorn for this address, nothing to do.
  if (user == null) return;

  user.isActive = false;
  user.xp = BigInt.fromI32(0);
  user.health = BigInt.fromI32(0);
  user.streak = BigInt.fromI32(0);
  user.totalFocusTime = BigInt.fromI32(0);
  user.totalDonated = BigInt.fromI32(0);
  user.totalSessions = BigInt.fromI32(0);
  user.username = "";
  user.usernameLower = "";
  user.petName = "";
  user.petNameLower = "";
  user.boostEndTime = BigInt.fromI32(0);
  user.shieldCount = BigInt.fromI32(0);
  user.activeCosmetic = "";
  user.lastUpdatedBlock = event.block.number;
  user.lastUpdatedAt = event.block.timestamp;
  user.save();

  let stats = getOrCreateGlobalStats();
  if (stats.totalUsers.gt(BigInt.fromI32(0))) {
    stats.totalUsers = stats.totalUsers.minus(BigInt.fromI32(1));
  }
  stats.save();
}
