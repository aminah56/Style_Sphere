const stories = [
  {
    title: 'Purple Reverie — Luxury Pret Moodboard',
    summary: 'How we blend Nishat’s minimal grids with Sapphire’s cinematic photography direction.',
    category: 'Editorial'
  },
  {
    title: 'Behind the Loom — Jamawar revival',
    summary: 'A look at our artisan partners and the craftsmanship behind each men’s sherwani.',
    category: 'Craft'
  },
  {
    title: 'Styling memo — Desk to mehfil',
    summary: 'Layering stitched kurtas with velvet shawls for winter soirées.',
    category: 'Guide'
  }
];

const Journal = () => (
  <section className="container py-10">
    <p className="text-xs tracking-[0.4em] uppercase text-purple-500">Journal</p>
    <h1 className="section-title">Notes from the atelier</h1>
    <div className="grid md:grid-cols-3 gap-6 mt-6">
      {stories.map((story) => (
        <article key={story.title} className="p-6 rounded-3xl bg-white shadow-lg border border-purple-50">
          <p className="text-xs uppercase tracking-[0.4em] text-purple-400">{story.category}</p>
          <h3 className="text-xl text-purple-900 mt-3">{story.title}</h3>
          <p className="text-sm text-gray-600 mt-2">{story.summary}</p>
          <button className="mt-4 text-xs tracking-[0.4em] uppercase text-purple-700">Read feature →</button>
        </article>
      ))}
    </div>
  </section>
);

export default Journal;

