import { useState } from 'react';
import { X } from 'lucide-react';

const stories = [
  {
    id: 1,
    title: 'Purple Reverie — Luxury Pret Moodboard',
    summary: 'How we blend minimal grids with cinematic photography direction for a timeless look.',
    category: 'Editorial',
    image: '/images/journal/purple_reverie.png',
    fullStory: `In the heart of Lahore, as the twilight embraces the city, the sky turns into a deep, mystical shade of purple—a color that has long signified royalty and wisdom in our heritage. 

Our 'Purple Reverie' collection is an ode to this fleeting moment. We wanted to move away from the noise of fast fashion and return to something serene and grounding. 

The moodboard for this collection was covered in swatches of raw silk and organza, pinned next to photographs of Mughal arches in shadow. It’s about finding balance: the sharpness of geometric grids meeting the fluidity of eastern drapery. Every piece is designed to make you feel regal yet effortless, carrying the quiet confidence of the evening sky.`
  },
  {
    id: 2,
    title: 'Behind the Loom — Jamawar revival',
    summary: 'A look at our artisan partners and the craftsmanship behind each men’s sherwani.',
    category: 'Craft',
    image: '/images/journal/behind_the_loom.png',
    fullStory: `Travel with us to the winding streets of the inner city, where the rhythmic clatter of the handloom is the heartbeat of the community. Here, Master Artisan Rafiq Sahab has been weaving magic for over forty years.

"The thread speaks to you," he says, his weathered hands moving with practiced grace over the golden warp. Reviving the authentic Jamawar weave was not just a business decision for StyleSphere; it was a promise to preserve a dying art.

Each sherwani in our collection takes weeks of painstaking effort. It is not just fabric; it is a labor of love, a story of patience, and a testament to the hands that created it. When you wear it, you carry a piece of history.`
  },
  {
    id: 3,
    title: 'Styling memo — Desk to Mehfil',
    summary: 'Layering stitched kurtas with velvet shawls for winter soirées.',
    category: 'Guide',
    image: '/images/journal/styling_memo.png',
    fullStory: `Winter in Pakistan is synonymous with weddings and late-night Qawwali nights (Mehfils). But the modern woman is constantly on the move—from boardrooms to ballrooms.

Our latest styling edit focuses on versatility. Pair our crisp, stitched cotton kurtas with a heavy, embroidered velvet shawl to instantly transform your look. The contrast of the matte cotton against the lustrous velvet creates a texture play that is sophisticated and chic.

Add a pair of statement jhumkas and khussas, and you are ready to transition seamlessly from your work desk to the center stage of the evening's festivities. It's about practical luxury that doesn't compromise on elegance.`
  }
];

const Journal = () => {
  const [activeStory, setActiveStory] = useState(null);

  return (
    <section className="container py-16 relative">
      <div className="flex flex-col md:flex-row justify-between items-end mb-10">
        <div>
          <p className="text-xs tracking-[0.4em] uppercase text-purple-600 mb-2">The Journal</p>
          <h1 className="text-3xl md:text-4xl font-serif text-purple-950">Notes from the Atelier</h1>
        </div>
        <p className="text-sm text-gray-500 max-w-md mt-4 md:mt-0">
          Stories of craft, culture, and creativity. A glimpse behind the seams of StyleSphere.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {stories.map((story) => (
          <article
            key={story.id}
            className="group cursor-pointer flex flex-col gap-4"
            onClick={() => setActiveStory(story)}
          >
            <div className="relative overflow-hidden aspect-[4/5] rounded-lg">
              <img
                src={story.image}
                alt={story.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 backdrop-blur px-3 py-1 text-[10px] tracking-[0.2em] uppercase rounded-full">
                  {story.category}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-medium text-purple-950 group-hover:text-purple-700 transition-colors">
                {story.title}
              </h3>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                {story.summary}
              </p>
              <button className="mt-4 text-xs tracking-[0.3em] uppercase text-purple-800 border-b border-purple-200 pb-1 group-hover:border-purple-800 transition-all">
                Read Story
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Story Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveStory(null)}
          />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col md:flex-row animate-fade-in">
            <button
              onClick={() => setActiveStory(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/50 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>

            <div className="w-full md:w-1/2 h-64 md:h-auto">
              <img
                src={activeStory.image}
                alt={activeStory.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <span className="text-xs tracking-[0.3em] uppercase text-purple-500 mb-4 block">
                {activeStory.category}
              </span>
              <h2 className="text-3xl font-serif text-purple-950 mb-6 leading-tight">
                {activeStory.title}
              </h2>
              <div className="prose prose-purple prose-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {activeStory.fullStory}
              </div>
              <div className="mt-10 pt-6 border-t border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-900 font-serif italic">
                  S
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">StyleSphere Editorial</p>
                  <p className="text-xs text-gray-500">December 10, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Journal;

