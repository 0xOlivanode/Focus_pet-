import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — FocusPet",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black mb-10 inline-block">
          ← Back to FocusPet
        </Link>

        <h1 className="text-4xl font-anton uppercase mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-10">Last updated: May 8, 2026</p>

        <div className="prose prose-neutral max-w-none text-[15px] leading-relaxed space-y-8">

          <section>
            <h2 className="text-lg font-bold mb-2">1. Overview</h2>
            <p>FocusPet is designed with privacy in mind. We collect only what is necessary to operate the App. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Wallet address</strong> — collected when you connect your wallet. Used to identify your account and record on-chain activity.</li>
              <li><strong>Focus session data</strong> — session duration and timing, recorded on the Celo blockchain and indexed by our subgraph. This data is public by nature of the blockchain.</li>
              <li><strong>Referral relationships</strong> — if you join via an invite link, the referrer's wallet address is stored in our database and passed on-chain at reward claim time.</li>
              <li><strong>Username and pet name</strong> — chosen by you during onboarding, stored on-chain and publicly visible on the leaderboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">3. Data We Do Not Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>We do not collect your name, email address, or phone number unless you contact us directly.</li>
              <li>We do not track your browsing activity outside the App.</li>
              <li>We do not store private keys or seed phrases.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">4. On-Chain Data</h2>
            <p>Transactions recorded on the Celo blockchain — including focus sessions, purchases, and reward claims — are permanently public and cannot be deleted. This is inherent to how blockchain technology works.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">5. Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>GoodDollar</strong> — used for identity (face) verification and engagement rewards. Their privacy policy applies to data processed during verification.</li>
              <li><strong>Privy / MiniPay</strong> — wallet authentication providers. Their privacy policies apply to wallet connection data.</li>
              <li><strong>Goldsky</strong> — indexes on-chain data via a subgraph. Only public blockchain data is indexed.</li>
              <li><strong>Supabase</strong> — stores referral relationships server-side. Data is stored in a secured database.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">6. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To display your leaderboard ranking and profile.</li>
              <li>To verify eligibility for GoodDollar engagement rewards.</li>
              <li>To attribute referral credits correctly.</li>
              <li>To operate the App's features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">7. Data Retention</h2>
            <p>Off-chain data (referral records) is retained for as long as needed to operate the referral program. On-chain data is permanent. You may request deletion of off-chain records by contacting us, but on-chain data cannot be removed.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">8. Security</h2>
            <p>We take reasonable measures to protect off-chain data. However, no system is completely secure. Do not share your wallet private key or seed phrase with anyone, including us.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will post the updated policy on this page with a new date.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">10. Contact</h2>
            <p>For privacy-related questions, contact us at <a href="mailto:salaki1902@gmail.com" className="underline">salaki1902@gmail.com</a>.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
