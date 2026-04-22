# FocusPet

FocusPet turns deep work into a on-chain progression system. Complete focus sessions, earn XP, and watch your pet evolve — from egg to elder — based purely on your real-world consistency. Built on Celo and integrated with the GoodDollar UBI economy.

Live at [focus-pet.xyz](https://focus-pet.xyz) — app at [app.focus-pet.xyz](https://app.focus-pet.xyz)

---

## How it works

### Focus sessions

Set a timer — 10, 25, 45 minutes, or a custom duration up to 2 hours — and stay focused. When the session ends, your pet receives XP and health is restored. Sessions are recorded on-chain via the FocusPet smart contract on Celo.

### Pet evolution

Your pet's stage is determined by cumulative XP:

| Stage  | Description                         |
| ------ | ----------------------------------- |
| Egg    | Starting state for every new user   |
| Baby   | First evolution after early sessions|
| Teen   | Mid-tier — pet becomes more expressive |
| Adult  | Long-term commitment milestone      |
| Elder  | Top tier — reserved for the consistent few |

### Health and decay

Pets lose 10 health every 24 hours. Neglect long enough and the pet goes dormant and stops earning XP. Feed it with G$ from the shop, or use a shield to protect your streak.

### Streaks and bonuses

A daily streak is maintained by completing at least one session per day. Streak length adds a percentage bonus to XP earned. A streak shield (purchasable in the shop) absorbs one missed day without resetting the counter.

### Night owl bonus

Sessions started between midnight and 6 AM receive a 1.1x XP multiplier.

---

## Supercharge

Supercharging streams GoodDollar (G$) directly to the official GoodDollar UBI Pool on Celo in real time using Superfluid. In return, the pet receives an XP boost, health decay is paused, and the stream contributes to the global UBI economy.

Three tiers are available:

| Tier         | Rate       | XP Multiplier |
| ------------ | ---------- | ------------- |
| Gentle flow  | 10 G$/mo   | 1.2x          |
| Power surge  | 50 G$/mo   | 1.4x          |
| Max overdrive| 100 G$/mo  | 1.7x          |

Streams can be stopped at any time.

---

## Shop

Items are purchased with G$. A 10% fee on all shop transactions is redirected to the UBI pool.

| Item         | Price    | Effect                                      |
| ------------ | -------- | ------------------------------------------- |
| Food         | 10 G$    | Restores pet health                         |
| Super Food   | 30 G$    | Restores more health                        |
| Energy Drink | 25 G$    | Activates a 2x XP boost for 24 hours        |
| Shield       | 100 G$   | Protects streak from one missed day         |
| Revival      | 50 G$    | Revives a dormant pet                       |
| Cosmetics    | varies   | Equippable items displayed on the pet view  |

---

## Identity verification

Users who complete GoodDollar's face verification receive a verified badge on their profile and leaderboard entry. Verification is handled through the GoodDollar Identity SDK and does not store biometric data on FocusPet.

---

## Leaderboard

A global leaderboard ranks users by XP. Each entry shows username, pet stage, streak length, and verified status. The leaderboard is open — no wallet connection required to view it.

---

## MiniPay

FocusPet runs natively inside Opera MiniPay. MiniPay users are connected automatically using the injected provider — no additional setup or wallet extension required. Gas is covered via cUSD.

---

## Tech stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Frontend       | Next.js 15 (App Router), React 19, Tailwind v4  |
| Auth           | Privy (email, social, embedded wallets)         |
| Blockchain     | Celo                                            |
| Contract       | Solidity — UUPS upgradeable (OpenZeppelin)      |
| Chain reads    | wagmi + viem                                    |
| Streaming      | Superfluid CFA Forwarder                        |
| GoodDollar     | Citizen SDK, Identity SDK, Engagement SDK       |
| Backend        | Supabase (leaderboard, session sync)            |
| Notifications  | Upstash QStash + Web Push API                   |
| Animations     | Framer Motion                                   |

---

## Smart contract

The `FocusPet` contract is deployed on Celo and handles:

- Recording focus sessions and computing XP with all active multipliers
- Health decay calculation based on time since last interaction
- Streak tracking and shield consumption
- G$ payments for shop items, with 10% routed to the UBI pool
- Superfluid flow rate reads via `ICFAv1Forwarder` to apply the correct Supercharge multiplier
- Cosmetic inventory and equipped state

The contract is UUPS upgradeable and owned by the deployer address.

---

## Running locally

```bash
cd dapp
cp .env.example .env.local   # fill in your keys
npm install
npm run dev
```

Required environment variables: Privy app ID, Supabase URL + anon key, Upstash QStash token, WalletConnect project ID, and the deployed contract address on Celo.

---

## Project structure

```
foccc/
  contracts/        Solidity source, artifacts, and deployment scripts
  dapp/
    src/
      app/          Next.js App Router pages and API routes
      components/   UI components
      hooks/        Wagmi and app-specific React hooks
      utils/        Pet stage logic, XP formulas, helpers
    public/         Static assets — pet sprites, shop images, icons
```
