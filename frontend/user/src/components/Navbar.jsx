import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineHeart, HiMagnifyingGlass, HiOutlineExclamationCircle, HiOutlineLifebuoy, HiOutlineBars3 } from 'react-icons/hi2';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import CategoryMenu from './CategoryMenu';
import { useAccountStatus } from '../hooks/useAccountStatus';
import { useAuth } from '../hooks/useAuth';
import ContactSupportModal from './ContactSupportModal';

const Navbar = () => {
  const { user } = useAuth();
  const { suspended } = useAccountStatus();
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [supportOpen, setSupportOpen] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    navigate(query.trim() ? `/products?q=${encodeURIComponent(query.trim())}` : '/products');
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
      {suspended && (
        <div className="bg-red-600 text-white">
          <div className="container mx-auto px-4 py-2.5 flex items-start gap-2.5 text-sm">
            <HiOutlineExclamationCircle className="text-lg shrink-0 mt-0.5" />
            <p>
              <span className="font-bold">Your account has been suspended.</span>{' '}
              You can still browse, but placing orders and writing reviews are disabled
              until a platform administrator reinstates your account.
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 text-primary shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-lg font-black text-white shadow-lg shadow-primary/20">S</div>
            <span className="hidden text-xl font-black tracking-tight text-slate-900 sm:inline">ShopSphere</span>
          </Link>
          <div className="hidden lg:block">
            <CategoryMenu />
          </div>
        </div>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-6 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands and more..."
            className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-sm text-slate-700 shadow-inner shadow-slate-100 outline-none ring-0 transition-all duration-200 placeholder:text-slate-400 focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-primary/10 hover:text-primary"
          >
            <HiMagnifyingGlass className="text-xl" />
          </button>
        </form>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setSupportOpen(true)}
            className="group flex flex-col items-center rounded-xl px-2 py-1.5 text-slate-600 hover:text-primary transition-colors"
            title="Help & Support"
          >
            <HiOutlineLifebuoy className="text-2xl transition-transform duration-200 group-hover:-translate-y-0.5" />
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 group-hover:text-primary sm:block">Help</span>
          </button>

          {user ? (
            <Link to="/profile" className="group flex flex-col items-center rounded-xl px-2 py-1.5 text-slate-600 hover:text-primary" title={user.name || 'Profile'}>
              <HiOutlineUser className="text-2xl transition-transform duration-200 group-hover:-translate-y-0.5 text-primary" />
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-primary sm:block max-w-[70px] truncate">
                {user.name ? user.name.split(' ')[0] : 'Profile'}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-primary/20 hover:bg-primary-dark transition-all"
            >
              <HiOutlineUser className="text-sm" />
              <span>Sign In</span>
            </Link>
          )}

          <Link to="/wishlist" className="group relative flex flex-col items-center rounded-xl px-2 py-1.5 text-slate-600 hover:text-red-500">
            <HiOutlineHeart className="text-2xl transition-transform duration-200 group-hover:-translate-y-0.5" />
            {wishlistItems.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm">{wishlistItems.length}</span>
            )}
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 group-hover:text-red-500 sm:block">Wishlist</span>
          </Link>

          <Link to="/cart" className="group relative flex flex-col items-center rounded-xl px-2 py-1.5 text-slate-600 hover:text-primary">
            <HiOutlineShoppingBag className="text-2xl transition-transform duration-200 group-hover:-translate-y-0.5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm">{itemCount}</span>
            )}
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 group-hover:text-primary sm:block">Cart</span>
          </Link>

          <button className="md:hidden rounded-full p-2 text-slate-700 hover:bg-slate-100 hover:text-primary">
            <HiOutlineBars3 className="text-2xl" />
          </button>
        </div>
      </div>

      <ContactSupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />

      <form onSubmit={handleSearch} className="relative px-4 pb-3 md:hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products, brands and more..."
          className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 pr-12 text-sm text-slate-700 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-6 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-primary/10 hover:text-primary"
        >
          <HiMagnifyingGlass className="text-xl" />
        </button>
      </form>
    </nav>
  );
};

export default Navbar;
