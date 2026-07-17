import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMenuAlt2, HiChevronRight } from 'react-icons/hi';
import { getCategoryTree } from '../api/products';

// "All Categories" mega-menu: Category → Subcategory → Product Type
// drill-down fed by the canonical taxonomy. Every node opens the listing
// filtered to that level.
const CategoryMenu = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState([]);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    getCategoryTree().then(setTree).catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function go(category, subcategory, productType) {
    const params = new URLSearchParams({ category });
    if (subcategory) params.set('subcategory', subcategory);
    if (productType) params.set('productType', productType);
    setOpen(false);
    navigate(`/products?${params.toString()}`);
  }

  const activeCategory = tree[active];

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors"
      >
        <HiOutlineMenuAlt2 className="text-xl" /> Categories
      </button>

      {open && tree.length > 0 && (
        <div className="absolute left-0 top-full mt-2 z-50 flex bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden" style={{ width: 'min(720px, 90vw)' }}>
          {/* level 1: categories */}
          <div className="w-64 max-h-[70vh] overflow-y-auto border-r border-gray-100 py-2">
            {tree.map((cat, idx) => (
              <button
                key={cat.name}
                onMouseEnter={() => setActive(idx)}
                onClick={() => go(cat.name)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left font-medium transition-colors ${idx === active ? 'bg-primary/5 text-primary' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <span className="truncate">{cat.name}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  {cat.count > 0 && cat.count}
                  <HiChevronRight />
                </span>
              </button>
            ))}
          </div>

          {/* levels 2-3: subcategories + product types of the hovered category */}
          <div className="flex-1 max-h-[70vh] overflow-y-auto p-5">
            {activeCategory && (
              <>
                <button onClick={() => go(activeCategory.name)} className="font-extrabold text-gray-900 hover:text-primary mb-4 block">
                  All {activeCategory.name} →
                </button>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {activeCategory.subcategories.map((sub) => (
                    <div key={sub.name}>
                      <button onClick={() => go(activeCategory.name, sub.name)} className="font-bold text-sm text-gray-900 hover:text-primary mb-2 block">
                        {sub.name}
                      </button>
                      <ul className="space-y-1">
                        {sub.productTypes.map((type) => (
                          <li key={type}>
                            <button onClick={() => go(activeCategory.name, sub.name, type)} className="text-sm text-gray-500 hover:text-primary transition-colors">
                              {type}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMenu;
