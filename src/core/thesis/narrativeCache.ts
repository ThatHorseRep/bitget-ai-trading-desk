// Narrative cache providing deterministic fallback explanations based on position quality.
// This file is used when the LLM request fails.

export function getNarrative(positionQuality: string): string {
  switch (positionQuality) {
    case "STRONGER":
      return "The position is assessed as STRONGER based on deterministic criteria.";
    case "MIXED":
      return "The position is assessed as MIXED based on deterministic criteria.";
    case "WEAKER":
      return "The position is assessed as WEAKER based on deterministic criteria.";
    case "INSUFFICIENT":
      return "The position is assessed as INSUFFICIENT based on deterministic criteria.";
    default:
      return "Unable to determine position quality; fallback narrative unavailable.";
  }
}


