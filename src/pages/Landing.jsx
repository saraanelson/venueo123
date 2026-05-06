import { Link } from 'react-router-dom';
import { ArrowRight, Users, Handshake, MapPin } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 lg:px-12 py-5">
        <h1 className="font-display text-2xl text-surface-800">Venueo</h1>
        <Link to="/auth" className="btn-primary">
          Get Started <ArrowRight size={16} />
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-28 text-center">
        <p className="text-sm font-medium text-brand-600 uppercase tracking-wider mb-4">
          Creator × Business Partnerships
        </p>
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-surface-900 leading-tight mb-6">
          Turn local spaces into<br />revenue-sharing events
        </h2>
        <p className="text-lg text-surface-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Venueo matches creators — yoga instructors, artists, wellness coaches — with
          local businesses for popup events. No upfront rental fees. Split the ticket
          revenue and grow together.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/auth" className="btn-primary text-base px-8 py-3">
            Start Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="max-w-5xl mx-auto px-6 pb-28">
        <h3 className="font-display text-2xl text-surface-800 text-center mb-12">
          How it works
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Users,
              title: 'Create your profile',
              desc: 'Sign up as a creator, business, brand, or charity. Tell us what you bring to the table.',
            },
            {
              icon: MapPin,
              title: 'Discover partners',
              desc: 'Browse member profiles or search Google Places for local businesses in your area.',
            },
            {
              icon: Handshake,
              title: 'Propose & collaborate',
              desc: 'Send partnership proposals, agree on a revenue split (like 65/35), and sign a simple agreement.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <h4 className="font-medium text-surface-800 mb-2">{title}</h4>
              <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-200 py-8 text-center text-xs text-surface-400">
        © {new Date().getFullYear()} Venueo. Built by Sara.
      </footer>
    </div>
  );
}
