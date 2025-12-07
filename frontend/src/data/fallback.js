export const heroSlides = [
  {
    id: 'luxury-pret',
    eyebrow: 'Winter 25 • Luxury Pret',
    title: 'Regal silhouettes in imperial purple',
    copy: 'Handworked resham, organza appliqués and dramatic volumes inspired by Sapphire and Nishat runways.',
    cta: 'Explore Women’s Luxury Pret',
    link: '/collections/women-luxury',
    image: 'https://images.unsplash.com/photo-1518540809872-d5ac475c8708?auto=format&fit=crop&w=1600&q=80',
    accent: '#f2c94c'
  },
  {
    id: 'mens-stitched',
    eyebrow: 'New Drop • Menswear',
    title: 'Tailored sherwanis for moonlit mehfils',
    copy: 'Structured prince coats and hand embellished waistcoats in jewel tones.',
    cta: 'Shop Men’s Stitched',
    link: '/collections/mens-stitched',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80',
    accent: '#b1a4ff'
  },
  {
    id: 'unstitched',
    eyebrow: 'Fabric Library',
    title: 'Unstitched edit for bespoke artistry',
    copy: 'Lawn, cotton net and jamawar bases ready for your atelier.',
    cta: 'Browse Fabric Stories',
    link: '/collections/unstitched',
    image: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?auto=format&fit=crop&w=1600&q=80',
    accent: '#ffd3e8'
  }
];

export const fallbackCategories = [
  {
    CategoryID: 1,
    CategoryName: "Men's Collection",
    Description: 'Complete menswear universe',
    children: [
      {
        CategoryID: 3,
        CategoryName: "Men's Stitched",
        Description: 'Ready to wear',
        children: [
          { CategoryID: 7, CategoryName: "Men's Casual", Description: 'Everyday kurtas' },
          { CategoryID: 8, CategoryName: "Men's Formal", Description: 'Occasionwear' },
          { CategoryID: 9, CategoryName: "Men's Luxury Pret", Description: 'Runway ready' }
        ]
      },
      {
        CategoryID: 4,
        CategoryName: "Men's Unstitched",
        Description: 'Fabric only',
        children: [
          { CategoryID: 10, CategoryName: "Men's Casual Unstitched", Description: 'Cotton staples' },
          { CategoryID: 11, CategoryName: "Men's Formal Unstitched", Description: 'Jamawar & silk' }
        ]
      }
    ]
  },
  {
    CategoryID: 2,
    CategoryName: "Women's Collection",
    Description: 'Pret, luxe, fabric',
    children: [
      {
        CategoryID: 5,
        CategoryName: "Women's Stitched",
        Description: 'Pret capsules',
        children: [
          { CategoryID: 12, CategoryName: "Women's Casual", Description: 'Desk-to-dinner' },
          { CategoryID: 13, CategoryName: "Women's Formal", Description: 'Occasion couture' },
          { CategoryID: 14, CategoryName: "Women's Luxury Pret", Description: 'Premium edit' }
        ]
      },
      {
        CategoryID: 6,
        CategoryName: "Women's Unstitched",
        Description: 'Fabric atelier',
        children: [
          { CategoryID: 15, CategoryName: "Women's Casual Unstitched", Description: 'Lawn 3-piece' },
          { CategoryID: 16, CategoryName: "Women's Formal Unstitched", Description: 'Organza & velvet' }
        ]
      }
    ]
  }
];

export const fallbackProducts = [
  {
    ProductID: 101,
    Name: 'Regal Amethyst Lehenga',
    Description: 'Hand embellished lehenga choli on tissue base with velvet shawl.',
    Price: 34999,
    CategoryName: "Women's Luxury Pret",
    tag: 'luxury',
    ImageURL: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
    isFallback: true,
    variants: [
      { VariantID: null, SizeID: 2, SizeName: 'S', ColorID: 1, ColorName: 'Amethyst', HexCode: '#673F86' },
      { VariantID: null, SizeID: 3, SizeName: 'M', ColorID: 1, ColorName: 'Amethyst', HexCode: '#673F86' }
    ],
    images: [{ ImageURL: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80' }]
  },
  {
    ProductID: 102,
    Name: 'Cotton Net Kurta Set',
    Description: 'Lilac cotton net kurta with tonal trousers.',
    Price: 5499,
    CategoryName: "Women's Casual",
    tag: 'stitched',
    ImageURL: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
    isFallback: true,
    variants: [
      { VariantID: null, SizeID: 2, SizeName: 'S', ColorID: 2, ColorName: 'Lilac', HexCode: '#C8A2C8' },
      { VariantID: null, SizeID: 3, SizeName: 'M', ColorID: 2, ColorName: 'Lilac', HexCode: '#C8A2C8' }
    ],
    images: [{ ImageURL: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80' }]
  },
  {
    ProductID: 103,
    Name: 'Prince Coat Sherwani',
    Description: 'Structured sherwani with zari borders and gold buttons.',
    Price: 18999,
    CategoryName: "Men's Formal",
    tag: 'mens',
    ImageURL: 'https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?auto=format&fit=crop&w=900&q=80',
    isFallback: true,
    variants: [
      { VariantID: null, SizeID: 4, SizeName: 'L', ColorID: 3, ColorName: 'Maroon', HexCode: '#800000' },
      { VariantID: null, SizeID: 5, SizeName: 'XL', ColorID: 3, ColorName: 'Maroon', HexCode: '#800000' }
    ],
    images: [{ ImageURL: 'https://images.unsplash.com/photo-1518806118471-f28b20a1d79d?auto=format&fit=crop&w=900&q=80' }]
  },
  {
    ProductID: 104,
    Name: 'Jamawar Fabric Pack',
    Description: '5 meter plum jamawar base for bespoke tailoring.',
    Price: 6999,
    CategoryName: "Men's Formal Unstitched",
    tag: 'fabric',
    ImageURL: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=900&q=80',
    isFallback: true,
    variants: [
      { VariantID: null, SizeID: 7, SizeName: 'FreeSize', ColorID: 4, ColorName: 'Jamawar Plum', HexCode: '#4B1248' }
    ],
    images: [{ ImageURL: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=900&q=80' }]
  },
  {
    ProductID: 105,
    Name: 'Lawn 3 Piece Bloom',
    Description: 'Printed lawn shirt, dupatta and pants in lilac haze.',
    Price: 3999,
    CategoryName: "Women's Casual Unstitched",
    tag: 'fabric',
    ImageURL: 'https://images.unsplash.com/photo-1458530970867-aaa3700e966d?auto=format&fit=crop&w=900&q=80',
    isFallback: true,
    variants: [
      { VariantID: null, SizeID: 7, SizeName: 'FreeSize', ColorID: 5, ColorName: 'Bloom', HexCode: '#F8C8DC' }
    ],
    images: [{ ImageURL: 'https://images.unsplash.com/photo-1458530970867-aaa3700e966d?auto=format&fit=crop&w=900&q=80' }]
  },
  {
    ProductID: 106,
    Name: 'Velvet Mehfil Shawl',
    Description: 'Handworked velvet shawl with gota borders.',
    Price: 10999,
    CategoryName: "Women's Formal Unstitched",
    tag: 'luxe-accessory',
    ImageURL: 'https://images.unsplash.com/photo-1504194104404-433180773017?auto=format&fit=crop&w=900&q=80',
    isFallback: true,
    variants: [
      { VariantID: null, SizeID: 7, SizeName: 'FreeSize', ColorID: 6, ColorName: 'Velvet Noir', HexCode: '#2F1A2F' }
    ],
    images: [{ ImageURL: 'https://images.unsplash.com/photo-1504194104404-433180773017?auto=format&fit=crop&w=900&q=80' }]
  }
];

