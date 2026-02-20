export default function SiteFooter() {
  return (
    <footer className="w-full mt-auto border-t border-white/5 bg-slate-900/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-slate-900 flex items-center justify-center text-cyan-300 font-bold">
                U2
              </div>
              <span className="text-lg font-bold text-white">U2ALGO</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              U2Algo School provides structured lessons for Support/Resistance, Elliott Wave, and Market Structure.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} U2Algo. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="https://ualgotrade.com/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="https://ualgotrade.com/terms-of-service" className="hover:text-slate-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
