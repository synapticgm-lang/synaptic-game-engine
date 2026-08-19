const OFFER_ONLY_ASK_RE =
  /\b(?:you could (?:ask|inquire)|you might (?:ask|inquire)|perhaps (?:you )?(?:ask|inquire)|you may (?:wish to |want to )?(?:ask|inquire)|consider asking|inquire about|ask (?:the \w+|him|her|them) to (?:elaborate|explain))\b/i;

function proseOnly(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[SYSTEM[^\]]*\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * GM spent the beat offering more questions / look-around instead of answering.
 * "You could inquire about X" is not an answer.
 */
export function isOfferOnlyUnansweredBeat(narrative: string): boolean {
  const prose = proseOnly(narrative);
  if (!prose) return false;
  if (!OFFER_ONLY_ASK_RE.test(prose)) return false;
  const npcAnswered =
    /["“][^"”]{12,}["”]/.test(prose)
    && /\b(says?|said|replies|replied|answers?|answered|explains?|explained|means)\b/i.test(prose);
  return !npcAnswered;
}
