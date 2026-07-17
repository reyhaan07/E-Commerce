import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Banner from '../components/Banner';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import { motion } from 'framer-motion';
import { listProducts, getCategories, toCardProduct } from '../api/products';

// cover images for category tiles, keyed by catalog category name
const CATEGORY_IMAGES = {
  Electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=800',
  Fashion: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800',
  'Home & Kitchen': 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=800',
  Accessories: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800',
  Footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
  Sports: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?q=80&w=800',
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
      
      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-gray-500">Pick from our curated categories for you</p>
            </div>
            <button onClick={() => navigate('/products')} className="text-primary font-bold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map(cat => <CategoryCard key={cat.id} category={cat} />)}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-gray-500">Our top sellers and picks for this week</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map(prod => <ProductCard key={prod.id} product={prod} />)}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 border-y bg-white">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                  { title: 'Free Delivery', desc: 'On orders over ₹99', icon: '🚚' },
                  { title: 'Secure Payment', desc: 'SSL Protected checkout', icon: '🛡️' },
                  { title: 'Easy Returns', desc: '30 Days money back', icon: '🔄' },
                  { title: '24/7 Support', desc: 'Customer help desk', icon: '📞' },
              ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-center md:text-left">
                      <span className="text-4xl">{item.icon}</span>
                      <div>
                          <h4 className="font-bold text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                  </div>
              ))}
          </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="container mx-auto px-4 relative z-10 text-center max-w-2xl">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Join Our Newsletter</h2>
              <p className="text-gray-600 mb-8">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
              <form className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter your email address"
                    className="flex-1 px-6 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  <button className="btn-primary">Subscribe</button>
              </form>
          </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
