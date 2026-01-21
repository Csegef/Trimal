import React from "react";
import MainLayout from "../layouts/MainLayout";

const PrivacyPolicy = () => {
  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        <div className="backdrop-blur-sm bg-stone-900/50 border-4 border-stone-700 rounded-xl md:rounded-2xl shadow-xl p-5 md:p-8">
          <h1 className="text-2xl md:text-3xl font-black text-amber-400 uppercase text-center mb-6 border-b-2 border-stone-600 pb-4">
            Privacy Policy
          </h1>

          <div className="space-y-6 text-stone-300">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                1. Information We Collect
              </h2>
              <p className="text-stone-300 leading-relaxed">
                We collect information to provide better services to our players:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-stone-300">
                <li><strong>Account Information:</strong> Username, email address, password (encrypted)</li>
                <li><strong>Game Data:</strong> Character information, progress, achievements, and in-game purchases</li>
                <li><strong>Technical Data:</strong> IP address, device information, game logs, and crash reports</li>
                <li><strong>Communication:</strong> Support tickets and feedback you provide</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                2. How We Use Your Information
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-stone-300">
                <li>To provide and maintain our game services</li>
                <li>To improve gameplay experience and fix technical issues</li>
                <li>To prevent cheating and ensure fair play</li>
                <li>To communicate important updates and announcements</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                3. Data Protection
              </h2>
              <p className="text-stone-300 leading-relaxed">
                We implement industry-standard security measures to protect your personal information. 
                However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                4. Third-Party Services
              </h2>
              <p className="text-stone-300 leading-relaxed">
                We may use third-party services for analytics, payment processing, and hosting. 
                These services have their own privacy policies governing data handling.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                5. Children's Privacy
              </h2>
              <p className="text-stone-300 leading-relaxed">
                Our services are not directed to children under 13. We do not knowingly collect 
                personal information from children under 13. If we become aware of such collection, 
                we will take steps to delete the information.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                6. Your Rights
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-stone-300">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your game data</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-amber-100 border-l-4 border-amber-500 pl-3">
                7. Contact Us
              </h2>
              <p className="text-stone-300 leading-relaxed">
                For privacy-related inquiries, contact our Data Protection Officer at:
                <br />
                <span className="text-amber-200">info.trimal.rpg@gmail.com</span>
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

export default PrivacyPolicy;