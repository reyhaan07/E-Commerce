import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Banner from '../components/Banner';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { FaTruck, FaShieldAlt, FaUndoAlt, FaHeadset } from 'react-icons/fa';
import { listProducts, getCategories, toCardProduct } from '../api/products';

// cover images for category tiles, keyed by catalog category name
const CATEGORY_IMAGES = {
  'Electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800',
  'Mobile Phones & Accessories': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800',
  'Computers & Laptops': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800',
  'Audio': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800',
  'Men\'s Fashion': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800',
  'Women\'s Fashion': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800',
  'Kitchen & Dining': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=800',
  'Footwear': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
  'Sports & Outdoors': 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?q=80&w=800',
  'Tablets & Accessories': 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=800',
};

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    getCategories()
      .then((cats) => setCategories(cats.slice(0, 4).map((c, idx) => ({
        id: idx,
        name: c.name,
        image: CATEGORY_IMAGES[c.name] || CATEGORY_IMAGES.Electronics,
      }))))
      .catch(() => {});
    listProducts({ sort: 'rating', limit: 4 })
      .then(({ products }) => setFeaturedProducts(products.map(toCardProduct)))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <Banner />

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">Curated picks</p>
              <h2 className="section-heading">Shop by Category</h2>
            </div>
            <button onClick={() => navigate('/products')} className="text-sm font-bold text-primary transition-colors hover:text-primary-dark">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {categories.map(cat => <CategoryCard key={cat.id} category={cat} />)}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">Top-rated picks</p>
              <h2 className="section-heading">Featured Products</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map(prod => <ProductCard key={prod.id} product={prod} />)}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-12">
        <div className="container mx-auto grid grid-cols-1 gap-8 px-4 md:grid-cols-4">
          {[
            { title: 'Free Delivery', desc: 'On orders over ₹99', icon: <FaTruck className="text-primary text-xl" /> },
            { title: 'Secure Payment', desc: 'SSL Protected checkout', icon: <FaShieldAlt className="text-primary text-xl" /> },
            { title: 'Easy Returns', desc: '30 Days money back', icon: <FaUndoAlt className="text-primary text-xl" /> },
            { title: '24/7 Support', desc: 'Customer help desk', icon: <FaHeadset className="text-primary text-xl" /> },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:p-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">{item.icon}</span>
              <div>
                <h4 className="font-bold text-slate-900">{item.title}</h4>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
