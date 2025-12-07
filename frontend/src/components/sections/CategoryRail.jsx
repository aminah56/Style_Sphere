const CategoryRail = ({ categories }) => (
  <section className="container mt-12">
    <div className="flex items-center justify-between mb-6">
      <h2 className="section-title">Shop by edit</h2>
      <p className="text-xs tracking-[0.3em] uppercase text-gray-500">Inspired by Sapphire & Nishat mega menus</p>
    </div>
    <div className="grid md:grid-cols-4 gap-6">
      {categories.map((category) => (
        <div
          key={category.CategoryID}
          className="p-5 rounded-3xl bg-white shadow-[0_20px_35px_rgba(85,0,143,0.08)] border border-purple-100"
        >
          <p className="text-xs tracking-[0.4em] uppercase text-purple-500">{category.CategoryName}</p>
          <p className="text-sm text-gray-500 mt-2">{category.Description}</p>
          <ul className="mt-4 space-y-2 text-sm text-purple-900">
            {category.children?.map((child) => (
              <li key={child.CategoryID} className="flex items-center justify-between">
                <span>{child.CategoryName.replace("Women's ", '').replace("Men's ", '')}</span>
                <span aria-hidden>→</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

export default CategoryRail;

