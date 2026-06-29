export type VariantId = 'control' | 'variant_a' | 'variant_b';

const VARIANTS: VariantId[] = ['control', 'variant_a', 'variant_b'];

function hashDate(date: Date): number {
  const str = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getVariant(date: Date = new Date()): VariantId {
  return VARIANTS[hashDate(date) % VARIANTS.length];
}

export interface LandingHeroCopy {
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
}

const HERO_VARIANTS: Record<VariantId, LandingHeroCopy> = {
  control: {
    title: 'Adaptive Credit Without Overcollateralization',
    subtitle: 'Credit limits that evolve with your on-chain behavior. No locked capital. No static risk models. Just programmable credit.',
    primaryCta: 'Connect Wallet',
    secondaryCta: 'Learn More',
  },
  variant_a: {
    title: 'Credit That Grows With You — No Collateral Needed',
    subtitle: 'Your on-chain history powers a living credit limit. No lockup, no static model — just capital that adapts to how you build.',
    primaryCta: 'Get Started',
    secondaryCta: 'See How It Works',
  },
  variant_b: {
    title: 'Unlock On-Chain Credit Without Locking Assets',
    subtitle: 'Behavior-based lending powered by Stellar smart contracts. Your activity defines your limit — not your collateral.',
    primaryCta: 'Claim Your Credit',
    secondaryCta: 'Explore the Protocol',
  },
};

export function getHeroCopy(variant: VariantId): LandingHeroCopy {
  return HERO_VARIANTS[variant];
}

export const FEATURES = {
  title: 'Credit That Adapts to You',
  items: [
    { title: 'Dynamic Credit Limits', description: 'Powered by real-time on-chain behavioral analysis and adaptive models.' },
    { title: 'No Overcollateralization', description: 'Powered by real-time on-chain behavioral analysis and adaptive models.' },
    { title: 'Algorithmic Risk Pricing', description: 'Powered by real-time on-chain behavioral analysis and adaptive models.' },
    { title: 'Continuous Credit Evolution', description: 'Powered by real-time on-chain behavioral analysis and adaptive models.' },
  ],
} as const;

export const HOW_IT_WORKS = {
  title: 'How Adaptive Credit Works',
  steps: ['Connect Wallet', 'Behavior Analysis', 'Risk Engine', 'Credit Line Issued', 'Score Evolves'],
} as const;

export const USE_CASES = {
  title: 'Built for Real Builders',
  items: [
    { title: 'SaaS Founders', description: 'Access adaptive capital aligned with your on-chain activity.' },
    { title: 'API Providers', description: 'Access adaptive capital aligned with your on-chain activity.' },
    { title: 'DAO Contributors', description: 'Access adaptive capital aligned with your on-chain activity.' },
  ],
} as const;

export const FAQ = {
  title: 'Frequently Asked Questions',
  items: [
    {
      q: 'What determines my credit limit?',
      a: 'Your limit is calculated from on-chain behavioral signals including transaction history, repayment patterns, liquidity activity, and protocol interactions.',
    },
    {
      q: 'Is collateral required?',
      a: 'No. Creditra uses adaptive behavioral analysis instead of fixed overcollateralization.',
    },
    {
      q: 'How is risk priced?',
      a: 'Risk is algorithmically evaluated and dynamically priced based on evolving behavioral signals.',
    },
    {
      q: 'What happens if I default?',
      a: 'Default events affect your evolving credit score and reduce future credit access.',
    },
    {
      q: 'Is Creditra custodial?',
      a: 'No. Creditra operates using smart contracts and remains non-custodial.',
    },
  ],
} as const;

export const FINAL_CTA = {
  title: 'Capital Should Work as Hard as You Do',
  button: 'Connect Wallet',
} as const;

export const HEADER = {
  brand: 'Creditra',
  nav: ['How It Works', 'Use Cases', 'FAQ'],
  cta: 'Connect Wallet',
} as const;

export const FOOTER = {
  columns: [
    {
      heading: 'Product',
      links: ['How It Works', 'Dashboard', 'Docs'],
    },
    {
      heading: 'Legal',
      links: ['Terms', 'Privacy Policy'],
    },
    {
      heading: 'Network',
      links: ['Built on Stellar', 'Smart Contract Secured'],
    },
  ],
} as const;
