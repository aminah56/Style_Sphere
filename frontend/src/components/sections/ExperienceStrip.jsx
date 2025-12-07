const highlights = [
  {
    title: 'Purple Rewards Club',
    copy: 'Earn 5% back on every order + first access to sapphire-inspired capsules.'
  },
  {
    title: 'Worldwide Delivery',
    copy: 'Ship to 40+ countries with duties-paid checkout & live tracking.'
  },
  {
    title: 'Atelier Services',
    copy: 'Book bespoke tailoring sessions at flagship lounges.'
  }
];

const ExperienceStrip = () => (
  <section className="bg-gradient-to-r from-[#2b0f4d] to-[#5d2ca4] text-white mt-16">
    <div className="container py-10 grid md:grid-cols-3 gap-8">
      {highlights.map((item) => (
        <div key={item.title}>
          <p className="text-xs tracking-[0.4em] uppercase text-purple-200">{item.title}</p>
          <p className="mt-2 text-sm leading-relaxed">{item.copy}</p>
        </div>
      ))}
    </div>
  </section>
);

export default ExperienceStrip;

