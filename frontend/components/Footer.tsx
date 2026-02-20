export const Footer = () => {
    return (
        <footer className="w-full mt-auto border-t border-white/5 bg-slate-900/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <img
                                src="/brand/logo-mark.svg"
                                alt="U2Algo"
                                className="w-8 h-8 rounded-lg border border-white/10 bg-slate-900"
                                draggable={false}
                            />
                            <span className="text-lg font-bold text-white font-space">U2ALGO</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            U2Algo is a backtest and signal platform for retail crypto traders.
                        </p>
                    </div>
                </div>
                
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>&copy; {new Date().getFullYear()} U2Algo. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                        <a href="/terms-of-service" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
