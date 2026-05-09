'use client';
import Link from 'next/link';
import { Zap, Database, Layout, Shield, ArrowRight, Code2, Globe, Bell } from 'lucide-react';

const features = [
  { icon: Layout, title: 'Dynamic UI', desc: 'Forms, tables, dashboards — all from config. Zero hardcoding.' },
  { icon: Database, title: 'Auto Database', desc: 'PostgreSQL tables provisioned instantly from your entity definitions.' },
  { icon: Shield, title: 'Auth Built-in', desc: 'JWT authentication with roles and user-scoped data out of the box.' },
  { icon: Code2, title: 'Fault Tolerant', desc: 'Works with incomplete, inconsistent, or partially incorrect configs.' },
  { icon: Globe, title: 'Multi-language', desc: 'i18n support with dynamic locale switching via config.' },
  { icon: Bell, title: 'Notifications', desc: 'Event-based in-app notifications triggered on entity actions.' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">AppForge</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
          <Zap size={14} /> Production-grade dynamic app generation
        </div>
        <h1 className="text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent">
          Build full-stack apps<br />from JSON config
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Drop in a JSON config — incomplete, inconsistent, whatever. AppForge provisions your database, generates your UI, and deploys your API automatically.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="btn-primary text-base px-6 py-3">
            Start building <ArrowRight size={18} />
          </Link>
          <Link href="/login" className="btn-secondary text-base px-6 py-3 bg-white/10 text-white border-white/20 hover:bg-white/20">
            Sign in
          </Link>
        </div>
      </div>

      {/* Code sample */}
      <div className="max-w-3xl mx-auto px-6 mb-20">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-gray-500 font-mono">app-config.json</span>
          </div>
          <pre className="text-sm text-green-400 font-mono p-6 overflow-auto text-left">
{`{
  "name": "CRM App",
  "entities": [{
    "name": "contact",
    "fields": [
      { "name": "name", "type": "string" },
      { "name": "email", "type": "string", "unique": true },
      { "name": "status", "type": "string" }
    ],
    "timestamps": true
  }],
  "pages": [{
    "id": "contacts",
    "title": "Contacts",
    "path": "/contacts",
    "components": [{
      "type": "table",
      "entity": "contact",
      "searchable": true,
      "exportable": true
    }]
  }]
}`}
          </pre>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/8 transition-colors">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <Icon size={20} className="text-indigo-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-white/10 py-8 text-center text-gray-500 text-sm">
        Built for the Full Stack Developer Internship Task — Track A
      </footer>
    </div>
  );
}
