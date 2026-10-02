"use client";

import { DEMO_PROFILE } from "@/lib/demo/profile";
import type { DealershipProfile } from "@/lib/domain/types";

/**
 * Client-side storage of the dealership profile produced by onboarding.
 * In demo mode the profile lives in localStorage; in production it is a row in
 * `dealerships` (see supabase/migrations).
 */
const KEY = "ossian.profile";

export function loadProfile(): DealershipProfile {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DealershipProfile;
  } catch {}
  return DEMO_PROFILE;
}

export function saveProfile(p: DealershipProfile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function clearProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function hasCustomProfile() {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}
