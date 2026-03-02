_FocusPet: GoodBuilders Season 3 Documentation_
**Executive Summary**
FocusPet is a gamified productivity application built on the Celo blockchain, designed to improve users' attention spans and discipline. By combining the proven Pomodoro technique with a digital pet companion, FocusPet transforms deep work into achievable, rewarding milestones.

Crucially, FocusPet leverages the GoodDollar (G$) ecosystem to create a circular economy where personal productivity directly translates into social impact and universal basic income (UBI) contributions.

_Core Mechanics: Focus → Earn → Nurture → Contribute_
The core loop of FocusPet is designed to foster consistency and discipline:

Commit to Focus: Users select a focus duration (30 sec, 10 mins, 25 mins, 45 mins), optionally enable ambient focus sounds, and start the timer.
Earn Reputation: For every second of uninterrupted focus, users earn 1 XP. XP dictates the user's standing on the global leaderboard, serving as a reputational signal of discipline.
The Penalty of Distraction: If a user navigates away from the active tab/page for more than 5 seconds, the focus session is automatically canceled. This results in the loss of potential XP and negatively impacts the "Health" (represented by a % heart icon) of their digital pet.
Nurturing the Pet: To restore a declining pet's health or maintain its energy, users must utilize the Pet Shop, which is powered entirely by the GoodDollar (G$) token.

_🔗 GoodBuilders Integrations (The 5 Pillars)_
FocusPet was built specifically to align with the GoodBuilders Season 3 mandate: driving real usage, adoption, and utility for the G$ token. Here is how the 5 required features are implemented natively within the app:

1. Payments/Rewards using G$ (The Pet Shop Economy)
   The internal economy of FocusPet runs on G$. While XP is earned through time spent focusing, the actual maintenance and upgrading of the digital pet require G$.

Consumables: Users spend G$ to revive a pet whose health has declined due to broken focus sessions.
Boosts & Cosmetics: Users spend G$ to purchase energy drinks, maintain energy levels, and unlock cosmetic improvements to increase the pet's happiness. 2. Identity (Proof of Personhood)
To ensure the integrity of the leaderboard and prevent sybil attacks farming XP or manipulating the UBI integrations, FocusPet requires users to log in with a Web3 wallet. (Note: If integrating the GoodDollar Face Verification SDK, this is where the sybil-resistance is enforced before allowing users to interact with the Pet Shop or UBI pool).

3. Native Claim Flow
   FocusPet brings the GoodDollar ecosystem directly to the user. Instead of leaving the application to claim their daily UBI, UBI claiming is built natively into the app. This creates a seamless experience: claim your daily UBI, and immediately use it in the Pet Shop to feed your pet before starting a focus session.

4. Activity Fees ➔ UBI Pool (Social Impact)
   This is the core of FocusPet's circular economy. When a user spends G$ in the Pet Shop (e.g., buying an energy drink to revive their pet), a routing protocol automatically directs a portion of those activity fees back into the GoodDollar UBI Pool.

Transparency: The UI provides a dedicated dashboard where users can view their personal contributions alongside the total community contributions to the UBI pool, gamifying social impact. 5. G$ Supertoken / Streaming (Supercharge Mode)
To provide continuous, real-time value transfer, FocusPet implements Supercharge Streaming using Superfluid.

Instead of one-time purchases, users can open a continuous G$ stream to keep their pet energized over time.
The Impact Loop: Just like the Pet Shop purchases, a predefined portion of the funds actively streaming from the user's wallet is routed directly into the UBI pool. As long as the stream is open, the user is continuously funding global basic income.
🛠️ User Flow & Onboarding
Connect: User connects standard Web3 wallet.
Profile: User claims a unique username and names their digital pet.
Learn: User clicks "How to play" in the navbar to read the interactive Instructions Modal, explaining the XP system, Pet Health, and G$ utility.
Claim & Focus: User claims daily G$ UBI natively, sets a 25-minute timer, and begins deep work.
Economy: If the user succeeds, they climb the leaderboard. If they fail (switch tabs for >5s), their pet loses health. They then spend G$ in the shop (contributing to UBI) or open a Supercharge Stream to revive it.
Try it live at
[Try it live at](https://focus-pet.xyz/)
