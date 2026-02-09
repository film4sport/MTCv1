'use client';

const partners = [
  {
    name: 'Canadian Tire',
    logo: 'https://i.imgur.com/gr5hLFh.png',
    url: 'https://www.canadiantire.ca/en/store-details/on/orangeville-on-73.html',
  },
  {
    name: 'Mono Cliffs Inn',
    logo: 'https://i.imgur.com/Uffmlof.jpeg',
    url: 'https://www.monocliffsinn.ca/',
  },
  {
    name: 'Dawn Bennett Realty',
    logo: 'https://i.imgur.com/noYDGIC.png',
    url: 'https://www.realtor.ca/agent/1416101/dawn-bennett-12612-highway-50-ste-1-bolton-ontario-l7e1t6',
  },
];

export default function Partners() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div className="text-center mb-12 fade-in">
          <span className="section-label uppercase font-medium">// Our Partners</span>
          <h3 className="headline-font text-2xl md:text-3xl mt-4 text-gray-900">
            Proudly Supported By
          </h3>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 fade-in">
          {partners.map((p) => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="partner-logo">
              <img
                src={p.logo}
                alt={p.name}
                className="h-16 md:h-20 w-auto rounded-lg object-contain"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
