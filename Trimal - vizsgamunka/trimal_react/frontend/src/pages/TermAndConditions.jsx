import React from "react";
import MainLayout from "../layouts/MainLayout";

const TermsAndConditions = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        <div className="backdrop-blur-sm bg-stone-900/50 border-4 border-stone-700 rounded-xl md:rounded-2xl shadow-xl p-5 md:p-8">
          <h1 className="text-2xl md:text-3xl font-black text-amber-400 uppercase text-center mb-6 border-b-2 border-stone-600 pb-4">
            Terms & Conditions
          </h1>

          <div className="space-y-6 text-stone-300">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                1. Acceptance of Terms
              </h2>
              <p className="text-stone-300 leading-relaxed">
                By accessing and using our game services, you agree to be bound by these Terms and Conditions. 
                If you do not agree with any part of these terms, you must not use our services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                2. Account Registration
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-stone-300">
                <li>You must be at least 13 years old to create an account</li>
                <li>You are responsible for maintaining the confidentiality of your account</li>
                <li>One account per individual is permitted</li>
                <li>Sharing accounts is strictly prohibited</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                3. Game Rules and Conduct
              </h2>
              <p className="text-stone-300 leading-relaxed">
                Players must adhere to fair play principles. The following behaviors are strictly prohibited:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-stone-300">
                <li>Cheating, hacking, or using unauthorized third-party software</li>
                <li>Exploiting game bugs or glitches</li>
                <li>Harassment, hate speech, or toxic behavior towards other players</li>
                <li>Real-money trading of in-game items</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                4. Virtual Items and Currency
              </h2>
              <p className="text-stone-300 leading-relaxed">
                All virtual items and currency are licensed, not sold. We reserve the right to modify, remove, 
                or discontinue any virtual items at our discretion. No refunds will be provided except as required by law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                5. Termination
              </h2>
              <p className="text-stone-300 leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these terms. 
                Termination may result in loss of access to all game content and virtual items.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                6. Changes to Terms
              </h2>
              <p className="text-stone-300 leading-relaxed">
                We may update these Terms and Conditions periodically. Continued use of our services 
                after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-stone-700">
              <p className="text-sm text-stone-400 italic">
                Last Updated: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TermsAndConditions;