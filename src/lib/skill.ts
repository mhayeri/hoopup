import type { SkillLevel } from './database.types';

/** Display label for each skill tier. */
export const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  pro: 'Pro',
};

/**
 * Per-tier pill color classes (tinted bg + text), shared by the friends/identity
 * skill pill (`ProfileIdentity`) and the home session-card host skill tag
 * (`HomeSessionCard`). Backed by the `--color-skill-*` tokens in `index.css`.
 */
export const SKILL_PILL: Record<SkillLevel, string> = {
  beginner: 'bg-[var(--color-skill-beginner)]/15 text-[var(--color-skill-beginner)]',
  intermediate: 'bg-[var(--color-skill-intermediate)]/15 text-[var(--color-skill-intermediate)]',
  advanced: 'bg-[var(--color-skill-advanced)]/15 text-[var(--color-skill-advanced)]',
  pro: 'bg-[var(--color-skill-pro)]/15 text-[var(--color-skill-pro)]',
};

/** CSS-var refs for the roster's inline-styled left rail + Skill-column text. */
export const SKILL_TIER_COLOR: Record<SkillLevel, string> = {
  beginner: 'var(--color-skill-beginner)',
  intermediate: 'var(--color-skill-intermediate)',
  advanced: 'var(--color-skill-advanced)',
  pro: 'var(--color-skill-pro)',
};

/** Rail/text color for a player with no skill level set. */
export const SKILL_TIER_NONE = 'rgba(255,255,255,0.3)';
