/**
 * Published legal copy for /terms and /privacy pages.
 * Keep in sync with docs/legal/*.md after solicitor review.
 * Placeholders: replace SUPPORT_EMAIL and LEGAL_ENTITY before go-live.
 */

export const LEGAL_SUPPORT_EMAIL = 'support@synapticgm.com'; // TODO: confirm
export const LEGAL_LAST_UPDATED = '16 August 2026';

export type LegalDocId = 'terms' | 'privacy';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDoc {
  id: LegalDocId;
  title: string;
  path: string;
  lastUpdated: string;
  draftBanner: string;
  sections: LegalSection[];
}

export const TERMS_DOC: LegalDoc = {
  id: 'terms',
  title: 'Terms of Service',
  path: '/terms',
  lastUpdated: LEGAL_LAST_UPDATED,
  draftBanner:
    'This is a product draft pending solicitor review. Placeholders for company details may still appear. Not legal advice.',
  sections: [
    {
      heading: '1. Acceptance',
      paragraphs: [
        'By creating an account, accessing, or using SynapticGM (the website, apps, and related services), you agree to these Terms. If you do not agree, do not use the Service.',
        'If you enable Kid Mode or set a parental PIN for a child, you also agree to the Kid Mode and parental-responsibility rules below.',
      ],
    },
    {
      heading: '2. The Service',
      paragraphs: [
        'SynapticGM is an AI-assisted tabletop and story game. Features may include hosted AI narration and images, free and paid subscription tiers, turn packs and cosmetics, optional rewarded ads for extra turns, optional Admin (BYOK) on website builds, and cloud saves when signed in.',
        'We may change, suspend, or discontinue features with reasonable notice where practicable. Beta features may be unstable.',
      ],
    },
    {
      heading: '3. Eligibility and accounts',
      paragraphs: [
        'You must be able to form a binding contract under applicable law. If you are under 18, you may use the Service only with a parent or guardian’s consent and supervision as required by law and these Terms.',
        'You are responsible for your account credentials and activity under your account. We may refuse, suspend, or terminate accounts that breach these Terms or create risk (fraud, abuse, illegal content attempts, chargeback abuse, and similar).',
      ],
    },
    {
      heading: '4. Subscriptions, packs, ads, and payments',
      paragraphs: [
        'The Free tier includes limited daily turns and other caps shown in-product. Paid plans unlock higher capacity and benefits described at purchase. Subscriptions renew until cancelled; cancel via the payment provider portal or in-app controls when available.',
        'Turn packs and cosmetics are digital goods. Unless law requires otherwise, packs and cosmetics do not expire once granted, and cancelling a subscription does not remove already-purchased packs or cosmetics.',
        'Adult Free may use optional rewarded ads subject to a daily cap. Kid Mode may offer rewarded ads without that adult cap, using family-appropriate ad settings where available. Rewards (extra turns, or +1 cheap memorable picture on Free after the weekly splash cap) are granted only after a completed rewarded view.',
        'Admin (BYOK), where offered, means you supply your own AI keys and pay those providers; hard safety rails may still apply. Prices may include tax. Payment processors’ terms also apply.',
        'Digital content is generally non-refundable once delivered except where consumer law requires otherwise. If a paid unlock fails after successful payment, contact support with your email and payment reference.',
      ],
    },
    {
      heading: '5. Kid Mode, parental PIN, and children’s use',
      paragraphs: [
        'Kid Mode applies stronger family-friendly filters. It reduces risk but cannot guarantee perfect output.',
        'When you set a Kid Mode PIN, you acknowledge that the PIN protects exiting Kid Mode, certain settings, and purchases (packs, themes, subscriptions, and similar). Rewarded ads in Kid Mode do not require the PIN.',
        'You must keep the PIN confidential and must not share it with children. You are responsible if a child learns, guesses, or is given the PIN and then makes purchases, changes settings, or exits Kid Mode.',
        'SynapticGM is not liable for purchases or setting changes made after a valid PIN entry (including during any short post-PIN purchase grace period shown in-product). By setting a PIN you confirm you are a parent, guardian, or authorised adult and accept this responsibility.',
        'Platform store rules (Google Play, App Store, and similar) also apply where you download the app.',
      ],
    },
    {
      heading: '6. AI-generated content',
      paragraphs: [
        'Story text, images, and suggestions are AI-assisted and may be inaccurate, repetitive, biased, or inconsistent. The Service is for entertainment only — not legal, medical, or financial advice. Filters reduce risk but cannot catch everything. Report issues via in-app feedback where available.',
      ],
    },
    {
      heading: '7. Acceptable use',
      paragraphs: ['You agree not to:'],
      bullets: [
        'attempt to generate or distribute illegal content, including child sexual abuse material, or content that exploits minors;',
        'bypass safety filters, Kid Mode, payments, or capacity limits except as we expressly allow;',
        'harass others, abuse the Service, reverse engineer or overload it beyond lawful use;',
        'use stolen payment methods or abuse refunds or chargebacks;',
        'resell or commercially exploit the Service without written permission.',
      ],
    },
    {
      heading: '8. Intellectual property',
      paragraphs: [
        'SynapticGM software, branding, UI, and curated materials are owned by us or our licensors. Open fonts, icons, and other free materials are listed on the in-product Credits page.',
        'We grant you a personal, non-exclusive licence to use the Service for your own entertainment. Cosmetics are licensed for use in SynapticGM, not for redistribution as standalone products.',
        'AI outputs may not be unique. Personal non-commercial reuse of your session text is generally fine; commercial reuse is at your own risk unless we agree otherwise in writing.',
      ],
    },
    {
      heading: '9. Feedback and third parties',
      paragraphs: [
        'Feedback and bug reports may be used to improve the Service. The Service depends on third parties (AI providers, payments, ads, hosting, auth). Their outages or policies can affect SynapticGM.',
      ],
    },
    {
      heading: '10. Disclaimers and liability',
      paragraphs: [
        'To the maximum extent permitted by law, the Service is provided “as is” and “as available” without warranties of any kind.',
        'To the maximum extent permitted by law, we are not liable for indirect or consequential loss. Our total liability relating to the Service is limited to the greater of amounts you paid us in the 12 months before the claim, or £50. Nothing excludes liability that cannot be limited under English law (including death or personal injury caused by negligence, or fraud).',
        'Without limiting the Kid Mode PIN section, we are not liable for PIN compromise or child-initiated purchases after PIN unlock.',
      ],
    },
    {
      heading: '11. Termination and changes',
      paragraphs: [
        'You may stop using the Service at any time. We may suspend or terminate access for breach or risk. We may update these Terms; material changes will be posted with a new “Last updated” date. Continued use after the effective date constitutes acceptance where allowed by law.',
      ],
    },
    {
      heading: '12. Governing law',
      paragraphs: [
        'These Terms are governed by the laws of England and Wales. Courts of England and Wales have exclusive jurisdiction, except that consumers may have mandatory rights to bring claims in their country of residence where applicable.',
      ],
    },
    {
      heading: '13. Contact',
      paragraphs: [
        `Questions: ${LEGAL_SUPPORT_EMAIL}. Replace placeholders for legal entity name and postal address before relying on this document in production.`,
      ],
    },
  ],
};

export const PRIVACY_DOC: LegalDoc = {
  id: 'privacy',
  title: 'Privacy Policy',
  path: '/privacy',
  lastUpdated: LEGAL_LAST_UPDATED,
  draftBanner:
    'This is a product draft pending solicitor review and ICO-aligned completion. Not legal advice.',
  sections: [
    {
      heading: 'Who we are',
      paragraphs: [
        `SynapticGM (“we”) provides an AI-assisted game. Contact: ${LEGAL_SUPPORT_EMAIL}.`,
      ],
    },
    {
      heading: 'What we collect',
      paragraphs: ['Depending on how you play, we may process:'],
      bullets: [
        'Account data — email, display name, auth provider IDs (for example Google sign-in);',
        'Gameplay and saves — cloud save data when sync is enabled;',
        'Billing entitlements — tier, packs, cosmetics, and payment references (card data stays with the payment processor);',
        'Support and ops — feedback, moderation logs, and telemetry such as errors and turn timing when enabled;',
        'Technical data — approximate device info, IP via hosting, browser type;',
        'Ads — ad networks may process identifiers under their policies; Kid Mode should use child-appropriate configurations where we offer ads.',
      ],
    },
    {
      heading: 'Why we process data',
      paragraphs: [
        'To provide and secure the Service, deliver purchases, support you, prevent abuse, improve reliability and safety, and meet legal obligations (including tax and accounting).',
        'UK GDPR bases typically include contract, legitimate interests (security and product improvement), and consent where required (for example certain cookies or ads).',
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'Kid Mode is a content filter. Parents or guardians who set a PIN are responsible for PIN security and purchases unlocked with that PIN (see Terms of Service). We do not sell personal data.',
      ],
    },
    {
      heading: 'Sharing',
      paragraphs: [
        'We share data with processors who help run the Service (hosting, auth, payments, AI providers, ad networks, email) under contracts. We do not sell your personal data.',
      ],
    },
    {
      heading: 'Retention and your rights',
      paragraphs: [
        'We keep account and entitlement records while your account is active and as needed for tax or legal reasons. You may request deletion subject to legal retention needs.',
        `UK rights include access, correction, deletion, restriction, objection, portability, and complaint to the ICO. Contact us first at ${LEGAL_SUPPORT_EMAIL}.`,
      ],
    },
    {
      heading: 'International transfers and changes',
      paragraphs: [
        'If data leaves the UK/EEA, we use appropriate safeguards where required. We will update this page when practices change.',
      ],
    },
  ],
};

export function getLegalDoc(id: LegalDocId): LegalDoc {
  return id === 'privacy' ? PRIVACY_DOC : TERMS_DOC;
}

export function legalPathToId(pathname: string): LegalDocId | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/terms' || path === '/terms-of-service') return 'terms';
  if (path === '/privacy' || path === '/privacy-policy') return 'privacy';
  return null;
}

export function isCreditsPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  return path === '/credits' || path === '/attribution';
}
