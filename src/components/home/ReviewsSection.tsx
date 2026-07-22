import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    avatar: 'PS',
    rating: 5,
    review: 'eYuvaShop has completely changed how I shop online. The quality is amazing and delivery is super fast. Totally worth every rupee!',
    product: 'Summer Dress Collection',
    date: '2 days ago',
  },
  {
    id: 2,
    name: 'Rahul Verma',
    rating: 5,
    avatar: 'RV',
    review: 'Best online shopping experience in India. The return policy is hassle-free and customer support is very helpful.',
    product: 'Wireless Headphones',
    date: '1 week ago',
  },
  {
    id: 3,
    name: 'Ananya Patel',
    rating: 5,
    avatar: 'AP',
    review: 'Genuinely impressed. I ordered skincare products and they arrived in perfect condition with great packaging. Will order again!',
    product: 'Luxury Skincare Kit',
    date: '3 days ago',
  },
  {
    id: 4,
    name: 'Karthik Reddy',
    rating: 4,
    avatar: 'KR',
    review: 'Great prices and authentic products. The app experience is smooth and finding products is very easy. Highly recommend!',
    product: 'Running Shoes',
    date: '5 days ago',
  },
];

export default function ReviewsSection() {
  return (
    <section className="py-12 bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 text-sm">Trusted by 50,000+ happy shoppers across India</p>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-sm font-semibold text-gray-700">4.8 out of 5</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-100 transition-all duration-200 relative"
            >
              <Quote className="absolute top-4 right-4 text-orange-100" size={32} />
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              {/* Review */}
              <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-4">
                &quot;{t.review}&quot;
              </p>
              {/* Product */}
              <p className="text-xs text-orange-500 font-medium mb-3">Purchased: {t.product}</p>
              {/* Author */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-gray-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.date}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-[10px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded">✓ Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
