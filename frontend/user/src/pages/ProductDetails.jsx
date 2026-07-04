import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { HiPlus, HiMinus, HiOutlineShoppingBag, HiOutlineHeart, HiStar, HiCube, HiShieldCheck, HiArrowPath } from 'react-icons/hi2';

const ProductDetails = () => {
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200');

  const product = {
    name: 'Premium Wireless Over-Ear Headphones',
    price: 14999,
    oldPrice: 19999,
    rating: 4.8,
    reviews: 1250,
    sku: 'BC-HP-001',
    category: 'Electronics',
    description: 'Experience pure sound with our flagship model. Designed for professional musicians and audiophiles alike, these headphones deliver stunning clarity and deep bass performance with active noise cancellation technology.',
    specs: ['Battery: 40 hrs', 'Noise Cancellation', 'Bluetooth 5.2', 'Weight: 250g'],
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200',
      'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?q=80&w=1200',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1200',
    ]
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Product Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 border border-gray-100">
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, idx) => (
                <button 
                    key={idx} 
                    onClick={() => setMainImage(img)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${mainImage === img ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="text-primary font-bold uppercase tracking-widest text-xs px-3 py-1 bg-primary/10 rounded-full">{product.category}</span>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-4 mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => <HiStar key={i} className={`text-xl ${i < 4 ? 'text-yellow-400' : 'text-gray-200'}`} />)}
                    <span className="font-bold text-gray-900 ml-1">{product.rating}</span>
                </div>
                <span className="text-gray-400 text-sm">({product.reviews} Customer Reviews)</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <span className="text-4xl font-extrabold text-gray-900">₹{product.price}</span>
              <span className="text-xl text-gray-400 line-through">₹{product.oldPrice}</span>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SAVE 25%</span>
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              {product.description}
            </p>

            <ul className="grid grid-cols-2 gap-4 mb-8">
                {product.specs.map(spec => (
                    <li key={spec} className="flex items-center gap-2 text-gray-700 font-medium">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> {spec}
                    </li>
                ))}
            </ul>

            <div className="space-y-6 mt-auto">
              <div className="flex items-center gap-6">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <button onClick={() => setQuantity(q => Math.max(1, q-1))} className="p-4 hover:bg-gray-200 transition-colors"><HiMinus /></button>
                  <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                  <button onClick={() => setQuantity(q => q+1)} className="p-4 hover:bg-gray-200 transition-colors"><HiPlus /></button>
                </div>
                <button className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 shadow-xl shadow-primary/20">
                  <HiOutlineShoppingBag className="text-xl" /> Add to Cart
                </button>
                <button className="w-14 h-14 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-red-50 hover:border-red-500 hover:text-red-500 transition-all">
                  <HiOutlineHeart className="text-2xl" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-gray-100">
                  <div className="text-center">
                      <HiCube className="mx-auto text-2xl text-primary mb-2" />
                      <p className="text-[10px] font-bold uppercase text-gray-400">Free Delivery</p>
                  </div>
                  <div className="text-center">
                      <HiShieldCheck className="mx-auto text-2xl text-primary mb-2" />
                      <p className="text-[10px] font-bold uppercase text-gray-400">1 Year Warranty</p>
                  </div>
                  <div className="text-center">
                      <HiArrowPath className="mx-auto text-2xl text-primary mb-2" />
                      <p className="text-[10px] font-bold uppercase text-gray-400">7 Days Return</p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
