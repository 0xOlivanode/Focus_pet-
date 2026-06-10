# FocusPet — MiniPay Mini App Overview

---

## 1. App Overview

**App Name:** FocusPet

**Logo & Branding Assets:** [TBC — add Cloudinary/Figma link]

**Website / App URL:**
- Landing: https://focus-pet.xyz
- App: https://app.focus-pet.xyz

**Figma Screens:** [TBC]

**Short Description:**

FocusPet is a productivity Mini App on Celo where users complete timed focus sessions to earn XP, grow a virtual pet, and compete on a global leaderboard — turning daily discipline into a visible, on-chain record of consistency.

---

## 2. Key Features & Use Cases

**Feature Highlights:**

1. **Focus Sessions** — Users pick 10, 25, or 45-minute sessions (or set custom durations). Each completed session earns XP, feeds their pet, and advances their streak.

2. **Virtual Pet Evolution** — Every user owns a Cyber Dino that evolves through multiple stages as a public record of their consistency. The more hours focused, the more the pet grows — with higher stages requiring progressively more dedication.

3. **Daily Quests** — Rotating tasks (e.g. "Complete 60 minutes of focus," "Maintain a 3-day streak") that reward bonus XP for consistent engagement.

4. **Global Leaderboard** — Players compete for the top spot by total XP, with periodic competitions like **Focus Blitz** (5-day sprints with streak bonuses and referral multipliers).

5. **Referral Program** — Users earn bonus points for every new user they bring into the app. Referral attribution is tracked on-chain and via backend.

6. **In-App Shop (USDT)** — Users spend USDT to buy items that help their pet survive and grow: food to restore health, energy drinks for a 2x XP boost, streak shields for protection, and cosmetics to personalise their pet.

7. **XP Boosts** — Purchasing an energy drink from the shop activates a 24-hour 2x XP multiplier, letting dedicated focusers accelerate their leaderboard climb.

**Target Market / User Persona:**
- MiniPay users (primarily Nigeria and sub-Saharan Africa) looking for a rewarding productivity app
- Productivity enthusiasts who want accountability and a fun reason to stay off their phone
- Mobile-first users across Africa, Asia, and Latin America
- Anyone who wants to build better habits and track their discipline visibly on-chain

---

## 3. Coverage & Regional Availability

**Geographical Scope:**
- Global — available to any MiniPay user
- Primary adoption: Nigeria, Kenya, and other sub-Saharan African markets
- No geographic restrictions; no licensing requirements currently

**Languages / Translations Offered:**
- English (primary)
- [TBC — additional languages planned based on MiniPay market distribution]

---

## 4. App Category / Industry

**Primary Category:** Productivity / GameFi

**Secondary Categories:** Social (leaderboard & competitions)

---

## 5. Integration Details

**Payment Token:**
- USDT (primary — used for all in-app purchases in the shop)

**Gas Fee Abstraction:**
- Transactions use CIP-64 (Celo fee abstraction), auto-detecting the user's best available stablecoin (USDT → USDC → USDm) so users never need to hold CELO for gas

**Blockchain:** Celo Mainnet (Chain ID: 42220)

**Core Contract:** `0x077AC6fAaE04B64b1CF8586F95D890491Bed04E7`

**Auth Methods:**
- MiniPay (auto-connect, no wallet prompt)
- Web3Auth (social / email login for non-MiniPay users)

---

## 6. Rollout Strategy

**Preferred Launch Date:** [TBC — targeting June 2026]

**Promo Activities / Offers:**
- **Focus Blitz Competitions** — periodic 5-day sprints with leaderboard prizes and referral bonuses (1,500 points per referral, 200 per session, 20% streak multiplier per day)
- **Referral Bonus Program** — every new user referred earns the inviter bonus points redeemable in future reward rounds
- **Proof of Ship momentum** — FocusPet placed **4th in Proof of Ship May 2026**, generating organic community attention heading into June

---

## 7. Compliance & Legal Considerations

**Regulatory Requirements:**
- XP and leaderboard rankings are engagement mechanics, not financial instruments
- Shop purchases are straightforward USDT microtransactions for in-app items
- No financial services license currently required; app functions as a productivity tool with in-app purchases
- No user funds are custodied by FocusPet — USDT goes directly to the smart contract; items are delivered on-chain

**KYC / AML Needs:**
- No additional KYC beyond MiniPay's existing user verification
- Wallet address + optional email stored in Supabase; no additional PII collected

---

## 8. User Support & Escalation

**Support Channels:**
- [TBC — email support address]
- [TBC — Help Center / FAQ link]
- In-app feedback mechanism: [TBC]

**Slack Channel:** [TBC]

---

## 9. Branding & Marketing Collateral

**Marketing Assets:**
- App URL for live testing: https://app.focus-pet.xyz
- Pet asset CDN: Cloudinary (Cyber Dino — Egg, Baby, Adult stages)
- High-res logo: [TBC]
- Figma screens: [TBC]

**Key Visual Identity:**
- Dark-first UI (black background, indigo/emerald/amber accents)
- Cyber Dino as the mascot — stages communicate user progress visually
- "FOCUS PET" wordmark in Anton bold uppercase

---

## 10. Success Metrics & KPIs

**Primary KPIs:**
- Monthly Active Users (MAU) completing ≥ 1 focus session
- Total focus hours logged (XP proxy)
- USDT volume transacted via in-app shop
- Day-over-day retention rate
- Referral conversion rate (invites sent → active users onboarded)
- Pet evolution distribution (% of users reaching Baby / Teen / Adult / Elder)
- Leaderboard participation rate during competition windows

**Reporting Frequency:** Weekly during active competition periods; monthly otherwise

---

## Optional Fields

**Competitive Differentiator:**
FocusPet is the only productivity app that converts focus time into verifiable on-chain XP and a living virtual pet — not points that expire, not fictitious tokens. The Cyber Dino is a tamper-proof, public record of a user's discipline. For MiniPay users, the entire experience runs natively inside MiniPay with no extra wallets, no gas complexity, and microtransaction purchases in USDT.

**Testimonials / Case Studies:** [TBC — pull from community after June launch]

**Future Features / Roadmap (June 2026+):**
- New pet species beyond Cyber Dino
- Multiplayer focus rooms (focus together, earn together)
- Streak protection items (in-app collectibles)
- Guild / team competitions
- Push notifications for session reminders and quest resets
- Expanded language support for key MiniPay markets
- Hidden reward drops for top focusers (location-based)
