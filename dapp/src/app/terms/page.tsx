import Link from "next/link";

export const metadata = {
  title: "Terms of Service — FocusPet",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-neutral-500 hover:text-black mb-10 inline-block">
          ← Back to FocusPet
        </Link>

        <h1 className="text-4xl font-anton uppercase mb-2">Terms of Service</h1>
        <p className="text-sm text-neutral-500 mb-10">Last updated: May 8, 2026</p>

        <div className="prose prose-neutral max-w-none text-[15px] leading-relaxed space-y-8">

          <section className="bg-neutral-100 rounded-lg p-4 text-sm">
            <p><strong>Operator:</strong> FocusPet is independently operated by Oshioke Salaki. It is not operated by, affiliated with, endorsed by, or in any way connected to Opera Norway AS, MiniPay, or any of their subsidiaries or partners. Any use of the MiniPay platform to access FocusPet is subject to Opera's own terms and policies separately.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using FocusPet ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">2. What FocusPet Does</h2>
            <p>FocusPet is a productivity application built on the Celo blockchain. Users complete timed focus sessions to earn experience points (XP), grow a virtual pet, and interact with on-chain features including GoodDollar rewards and a community leaderboard.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">3. Blockchain Transactions</h2>
            <p>FocusPet records focus sessions and purchases as transactions on the Celo blockchain. All on-chain transactions are irreversible. Network fees (gas) may apply. You are responsible for maintaining access to your wallet and private keys.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">4. GoodDollar Integration</h2>
            <p>FocusPet integrates with the GoodDollar protocol for identity verification and engagement rewards. Eligibility for rewards is determined by the GoodDollar smart contracts and is subject to their terms. FocusPet does not guarantee reward availability.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">5. Virtual Items and Shop</h2>
            <p>Items purchased in the FocusPet shop (food, cosmetics, shields) are digital goods recorded on-chain. Purchases are final and non-refundable. Virtual items have no monetary value outside the App.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">6. User Conduct</h2>
            <p>You agree not to manipulate, exploit, or abuse the App's systems including session recording, referral rewards, or leaderboard rankings. We reserve the right to disqualify accounts found engaging in fraudulent activity.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">7. Referral Program</h2>
            <p>FocusPet operates an opt-in referral program. Referral relationships are recorded in our database at the time of wallet connection. Referral credits are passed on-chain at reward claim time. Self-referrals are not permitted.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">8. Disclaimer of Warranties</h2>
            <p>The App is provided "as is" without warranty of any kind. We do not guarantee uptime, data persistence, or the availability of any specific feature. Blockchain networks may experience congestion or outages outside our control.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">9. Limitation of Liability</h2>
            <p>FocusPet is not liable for any loss of funds, loss of access to your wallet, or loss of virtual items arising from your use of the App.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">10. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-2">11. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:salaki1902@gmail.com" className="underline">salaki1902@gmail.com</a>.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
