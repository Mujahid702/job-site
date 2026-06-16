import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely flattens any resume builder skills structure (flat strings, SkillGroup objects,
 * or arrays of objects) into a clean, flat string array of non-empty skills.
 */
export function flattenSkills(rawSkills: any): string[] {
  const flattened: string[] = [];
  if (Array.isArray(rawSkills)) {
    rawSkills.forEach((group: any) => {
      if (typeof group === 'string') {
        if (group.trim()) flattened.push(group.trim());
      } else if (group && typeof group === 'object') {
        if (group.items && Array.isArray(group.items)) {
          group.items.forEach((item: any) => {
            if (typeof item === 'string') {
              if (item.trim()) flattened.push(item.trim());
            } else if (item && typeof item === 'object') {
              const val = item.name || item.skill || item.value;
              if (typeof val === 'string' && val.trim()) {
                flattened.push(val.trim());
              } else if (val !== undefined && val !== null) {
                flattened.push(String(val).trim());
              }
            } else if (item !== undefined && item !== null) {
              flattened.push(String(item).trim());
            }
          });
        } else if (group.name) {
          if (typeof group.name === 'string') {
            if (group.name.trim()) flattened.push(group.name.trim());
          } else {
            flattened.push(String(group.name).trim());
          }
        } else if (group.skill) {
          if (typeof group.skill === 'string') {
            if (group.skill.trim()) flattened.push(group.skill.trim());
          } else {
            flattened.push(String(group.skill).trim());
          }
        }
      }
    });
  }
  return flattened;
}

