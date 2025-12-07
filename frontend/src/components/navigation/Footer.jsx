const footerColumns = [
  {
    title: 'Boutiques',
    items: ['Lahore Gulberg', 'Islamabad F-8', 'Karachi Clifton', 'Multan Cantt']
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
          Eastern luxury inspired by Sapphire and Nishat aesthetics. Crafted in Pakistan. Delivered worldwide.
        </p>
      </div>
      {footerColumns.map((col) => (
        <div key={col.title}>
          <p className="text-xs tracking-[0.4em] uppercase mb-3 text-purple-200">{col.title}</p>
          <ul className="space-y-1 text-sm text-purple-100">
            {col.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
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

