const footerColumns = [
  {
    title: 'Boutiques',
    items: [
      { label: 'Lahore Gulberg', href: 'https://share.google/EETENlrPPoSFrrhq2' },
      { label: 'Islamabad F-8', href: 'https://www.google.com/search?q=islamabad+f8&rlz=1C1VDKB_enPK1148PK1148&oq=islamabad+f8&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIHCAEQIRiPAjIHCAIQIRiPAtIBCDYwNzFqMGo3qAIIsAIB8QXusBsKlB3LBw&sourceid=chrome&ie=UTF-8' },
      { label: 'Karachi Clifton', href: 'https://share.google/DMx4NqaLYNXtN7hQB' },
      { label: 'Multan Cantt', href: 'https://share.google/shfge96SXtORNAgOq' }
    ]
  },
  {
    title: 'Customer Care',
    items: ['Track Order', 'Return & Exchange', 'Store Locator', 'Contact']
  },
  {
    title: 'About StyleSphere',
    items: ['Our Story', 'Craftsmanship', 'Sustainability', 'Press']
  }
];

const Footer = ({ year }) => (
  <footer className="bg-[#120726] text-white mt-16 pt-10">
    <div className="container grid md:grid-cols-4 gap-8 pb-10">
      <div>
        <p className="tracking-[0.5em] text-sm uppercase">StyleSphere</p>
        <p className="text-sm text-purple-100 mt-3 leading-relaxed">
          Eastern luxury defined by timeless elegance and modern aesthetics. Crafted in Pakistan. Delivered worldwide.
        </p>
      </div>
      {footerColumns.map((col) => (
        <div key={col.title}>
          <p className="text-xs tracking-[0.4em] uppercase mb-3 text-purple-200">{col.title}</p>
          <ul className="space-y-2 text-sm text-purple-100/80">
            {col.items.map((item, index) => {
              const isLink = typeof item === 'object';
              const label = isLink ? item.label : item;
              const href = isLink ? item.href : null;

              return (
                <li key={index}>
                  {isLink ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white hover:pl-1 transition-all duration-300 flex items-center gap-2 group"
                    >
                      {label}
                      <span className="opacity-0 group-hover:opacity-100 text-xs transform -translate-x-2 group-hover:translate-x-0 transition-all">↗</span>
                    </a>
                  ) : (
                    <span className="hover:text-white transition-colors cursor-default">{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-white/10 py-4 text-center text-xs tracking-[0.3em] text-purple-200">
      © {year} StyleSphere. Crafted with love in Lahore. Purple theme inspired by amethyst gemstones.
    </div>
  </footer>
);

export default Footer;

