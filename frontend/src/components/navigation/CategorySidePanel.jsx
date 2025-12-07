import { useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

const CategoryNode = ({ node, level = 0, onClose }) => {
  const [isOpen, setIsOpen] = useState(level < 1);
  const navigate = useNavigate();

  const handleNavigate = (e) => {
    e.stopPropagation();
    navigate(`/collections/${node.CategoryID}`);
    if (onClose) onClose();
  };

  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="mb-2">
      <div className="w-full flex justify-between items-center text-left py-2 group">
        <button
          onClick={handleNavigate}
          className="text-sm text-purple-900 hover:text-purple-600 transition-colors flex-1 text-left"
          style={{ paddingLeft: level * 12 }}
        >
          {node.CategoryName}
        </button>
        {node.children?.length > 0 && (
          <button
            onClick={toggleOpen}
            className="text-purple-400 hover:text-purple-700 px-2"
          >
            {isOpen ? '−' : '+'}
          </button>
        )}
      </div>
      {isOpen && node.children && (
        <div className="border-l border-purple-100 ml-2">
          {node.children.map((child) => (
            <CategoryNode node={child} key={child.CategoryID} level={level + 1} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
};

const CategorySidePanel = ({ categories }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasData = useMemo(() => categories && categories.length > 0, [categories]);

  if (!hasData) return null;

  return (
    <>
      <button
        className="px-6 py-3 rounded-full border border-purple-200 text-purple-700 text-xs tracking-[0.4em] uppercase"
        onClick={() => setIsOpen(true)}
      >
        Browse Categories
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-[320px] max-w-[85vw] h-full bg-white shadow-xl border-r border-purple-100 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs tracking-[0.4em] uppercase text-purple-500">Collection Directory</p>
              <button className="text-xl text-purple-700" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>
            {categories.map((category) => (
              <CategoryNode
                node={category}
                key={category.CategoryID}
                onClose={() => setIsOpen(false)}
              />
            ))}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setIsOpen(false)} aria-hidden />
        </div>
      )}
    </>
  );
};

export default CategorySidePanel;

