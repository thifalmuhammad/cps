import React from 'react';
import { MapPin, TrendingUp, Database, Cloud, Users, BarChart3 } from 'lucide-react';

export default function LandingPage({ onLogin }) {
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/transparent_logo.png" alt="CPS Logo" className="h-10 w-10" />
              <span className="text-xl font-bold text-slate-900">Coffee Spatial System</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-slate-600 hover:text-slate-900">Features</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-slate-600 hover:text-slate-900">How It Works</button>
              <button onClick={() => scrollToSection('maps')} className="text-slate-600 hover:text-slate-900">Spatial Maps</button>
              <button onClick={() => scrollToSection('about')} className="text-slate-600 hover:text-slate-900">About Us</button>
              <button onClick={onLogin} className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800">Login</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center" style={{
        backgroundImage: 'url(/landing_page.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Coffee Spatial System</h1>
          <p className="text-xl md:text-2xl mb-4">Platform Data Spasial untuk Analisis Produktivitas Perkebunan Kopi Arabika Takengon</p>
          <p className="text-lg md:text-xl mb-8 flex items-center justify-center gap-2">
            <MapPin className="h-6 w-6" />
            Visualizing coffee, mapping productivity, empowering decisions.
          </p>
          <button onClick={onLogin} className="px-8 py-4 bg-white text-slate-900 rounded-md text-lg font-semibold hover:bg-slate-100">
            Get Started
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">☕ About the Platform</h2>
            <div className="w-20 h-1 bg-slate-900 mx-auto"></div>
          </div>
          <div className="max-w-4xl mx-auto text-lg text-slate-700 leading-relaxed space-y-4">
            <p>
              Coffee Spatial System adalah sistem basis data spasial yang dirancang untuk memetakan, menganalisis, dan memvisualisasikan informasi produktivitas kopi Arabika di wilayah Takengon.
            </p>
            <p>
              Dengan integrasi data agronomi, curah hujan, elevasi, tanah, dan pengelolaan perkebunan, platform ini memberikan wawasan spasial yang akurat bagi peneliti, pemerintah, petani, dan pengambil kebijakan.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Features</h2>
            <div className="w-20 h-1 bg-slate-900 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Spatial Mapping</h3>
              <p className="text-slate-600">Visualisasi peta persebaran perkebunan kopi dengan data geografis akurat</p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Productivity Analysis</h3>
              <p className="text-slate-600">Analisis produktivitas berdasarkan data agronomi dan lingkungan</p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Data Integration</h3>
              <p className="text-slate-600">Integrasi data curah hujan, elevasi, tanah, dan pengelolaan</p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="h-8 w-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Weather Forecast</h3>
              <p className="text-slate-600">Prakiraan cuaca real-time dari BMKG untuk perencanaan panen</p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Multi-User Access</h3>
              <p className="text-slate-600">Akses untuk petani, peneliti, dan pengambil kebijakan</p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Warehouse Management</h3>
              <p className="text-slate-600">Manajemen inventori dan tracking hasil panen</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <div className="w-20 h-1 bg-slate-900 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="h-12 w-12 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Register Farm</h3>
              <p className="text-slate-600">Petani mendaftarkan lokasi perkebunan dengan koordinat GPS</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Admin Verification</h3>
              <p className="text-slate-600">Admin memverifikasi dan memetakan area perkebunan</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Data Collection</h3>
              <p className="text-slate-600">Input data produktivitas dan pengelolaan perkebunan</p>
            </div>
            <div className="text-center">
              <div className="h-12 w-12 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Spatial Analysis</h3>
              <p className="text-slate-600">Visualisasi dan analisis data spasial untuk pengambilan keputusan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Spatial Maps Section */}
      <section id="maps" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Spatial Maps</h2>
            <div className="w-20 h-1 bg-slate-900 mx-auto mb-4"></div>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Platform ini menyediakan visualisasi peta interaktif dengan data satelit untuk melihat persebaran perkebunan kopi Arabika di wilayah Takengon secara real-time.
            </p>
          </div>
          <div className="bg-slate-100 rounded-lg p-12 text-center">
            <MapPin className="h-20 w-20 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Interactive map visualization available after login</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/transparent_logo.png" alt="CPS Logo" className="h-10 w-10" />
            <span className="text-xl font-bold">Coffee Spatial System</span>
          </div>
          <p className="text-slate-400 mb-4">Platform Data Spasial untuk Analisis Produktivitas Perkebunan Kopi Arabika Takengon</p>
          <p className="text-slate-500 text-sm">© 2024 Coffee Spatial System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
