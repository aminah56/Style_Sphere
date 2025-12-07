const Logo = ({ compact = false }) => (
  <div className="flex flex-col items-center leading-none select-none">
    <div className="relative font-serif text-purple-900 text-4xl font-semibold tracking-[0.2em]">
      <span className="logo-letter">S</span>
      <span className="logo-letter logo-letter--overlap">P</span>
    </div>
    {!compact && (
      <span className="text-[10px] tracking-[0.8em] uppercase text-purple-900 mt-1">StyleSphere</span>
    )}
  </div>
);

export default Logo;

