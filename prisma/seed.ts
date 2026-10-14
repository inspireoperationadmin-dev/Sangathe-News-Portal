import { PrismaClient, Role, ArticleStatus, Locale } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 சங்கதி ஆரம்பத் தரவுகள் (Seed Data) 3 மொழிகளில் ஏற்றப்படுகின்றன...");

  // 1. ஆரம்பப் பயனாளர்கள் (Users)

  const [adminPassword, reporterPassword] = await Promise.all([
    bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "ChangeMe-Admin-2026!", 12),
    bcrypt.hash(process.env.SEED_REPORTER_PASSWORD || "ChangeMe-Reporter-2026!", 12),
  ]);

  await prisma.user.upsert({
    where: { email: "admin@sangathe.com" },
    update: { name: "Sangathe Administrator", password: adminPassword, role: Role.ADMIN, isActive: true },
    create: { email: "admin@sangathe.com", name: "Sangathe Administrator", password: adminPassword, role: Role.ADMIN },
  });

  const reporter = await prisma.user.upsert({
    where: { email: "reporter@sangathe.com" },
    update: { isActive: true },
    create: {
      email: "reporter@sangathe.com",
      name: "யாழ் நிருபர்",
      password: reporterPassword,
      role: Role.REPORTER,
    },
  });

  console.log("✅ பயனாளர்கள் உருவாயினர்: Admin & Reporter");

  // 2. 8 முதன்மைப் பகுதிகள் - 3 மொழிகளில் (Trilingual Categories)
  const categoryData = [
    {
      slug: "local-news",
      order: 1,
      translations: {
        en: "Local News",
        ta: "உள்ளூர் செய்திகள்",
        si: "දේශීය පුවත්",
      },
    },
    {
      slug: "politics",
      order: 2,
      translations: {
        en: "Politics",
        ta: "அரசியல்",
        si: "දේශපාලන",
      },
    },
    {
      slug: "business-economy",
      order: 3,
      translations: {
        en: "Business / Economy",
        ta: "வணிகம் / பொருளாதாரம்",
        si: "ව්‍යාපාර සහ ආර්ථික",
      },
    },
    {
      slug: "sports",
      order: 4,
      translations: {
        en: "Sports",
        ta: "விளையாட்டு",
        si: "ක්‍රීඩා",
      },
    },
    {
      slug: "world",
      order: 5,
      translations: {
        en: "World",
        ta: "உலகம்",
        si: "විදෙස් පුවත්",
      },
    },
    {
      slug: "entertainment",
      order: 6,
      translations: {
        en: "Entertainment",
        ta: "பொழுதுபோக்கு",
        si: "විනෝදාස්වාදය",
      },
    },
    {
      slug: "education",
      order: 7,
      translations: {
        en: "Education",
        ta: "கல்வி",
        si: "අධ්‍යාපන",
      },
    },
    {
      slug: "crime",
      order: 8,
      translations: {
        en: "Crime",
        ta: "குற்றங்கள்",
        si: "අපරාධ",
      },
    },
  ];

  // 3 மொழிகளிலும் Categories-ஐ Loop செய்து Database-ல் ஏற்றுதல் (8 x 3 = 24 entries)
  for (const cat of categoryData) {
    // English
    await prisma.category.upsert({
      where: { slug_locale: { slug: cat.slug, locale: Locale.en } },
      update: { name: cat.translations.en, order: cat.order },
      create: {
        name: cat.translations.en,
        slug: cat.slug,
        locale: Locale.en,
        order: cat.order,
      },
    });

    // Tamil
    await prisma.category.upsert({
      where: { slug_locale: { slug: cat.slug, locale: Locale.ta } },
      update: { name: cat.translations.ta, order: cat.order },
      create: {
        name: cat.translations.ta,
        slug: cat.slug,
        locale: Locale.ta,
        order: cat.order,
      },
    });

    // Sinhala
    await prisma.category.upsert({
      where: { slug_locale: { slug: cat.slug, locale: Locale.si } },
      update: { name: cat.translations.si, order: cat.order },
      create: {
        name: cat.translations.si,
        slug: cat.slug,
        locale: Locale.si,
        order: cat.order,
      },
    });
  }

  console.log("✅ 8 முக்கிய செய்திப் பிரிவுகளும் தமிழ், ஆங்கிலம், சிங்களம் ஆகிய 3 மொழிகளிலும் உருவாயின! (Total: 24)");

    // 3. மாதிரி செய்திகள் (Demo / Seed News)

  const newsData = [
    {
      slug: "jaffna-new-it-park-initiative",
      categorySlug: "local-news",
      title: "யாழ்ப்பாணத்தில் புதிய தகவல் தொழில்நுட்ப மையம் உதயம்",
      summary:
        "வட மாகாண இளைஞர்களின் தகவல் தொழில்நுட்பத் திறனை ஊக்குவிக்கும் வகையில் யாழ்ப்பாணத்தில் புதிய தகவல் தொழில்நுட்ப மையம் அமைக்கப்படவுள்ளது.",
      content:
        "<p>யாழ்ப்பாண மாவட்டத்தில் தொழில்நுட்ப வளர்ச்சியை அடுத்த கட்டத்திற்கு கொண்டு செல்லும் நோக்கில் புதிய தகவல் தொழில்நுட்ப மையம் அமைக்கப்படவுள்ளது.</p><p>இதன் மூலம் இளைஞர்களுக்கு புதிய பயிற்சிகளும் வேலைவாய்ப்புகளும் உருவாகும் என எதிர்பார்க்கப்படுகிறது.</p>",
      image:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200",
      caption: "யாழ்ப்பாண தகவல் தொழில்நுட்ப மையம் - மாதிரி படம்",
      breaking: true,
    },

    {
      slug: "jaffna-road-development",
      categorySlug: "local-news",
      title: "யாழ்ப்பாணத்தில் முக்கிய வீதிகள் புனரமைப்பு",
      summary:
        "யாழ்ப்பாண நகரம் மற்றும் புறநகர் பகுதிகளில் சேதமடைந்துள்ள முக்கிய வீதிகளை புனரமைக்கும் பணிகள் ஆரம்பிக்கப்படவுள்ளன.",
      content:
        "<p>யாழ்ப்பாணத்தின் பல பகுதிகளில் சேதமடைந்துள்ள வீதிகளை புனரமைக்கும் நடவடிக்கைகள் முன்னெடுக்கப்படவுள்ளன.</p><p>பொதுமக்களின் போக்குவரத்து வசதியை மேம்படுத்துவதே திட்டத்தின் முக்கிய நோக்கமாகும்.</p>",
      image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
      caption: "வீதிப் புனரமைப்பு - மாதிரி படம்",
      breaking: false,
    },

    {
      slug: "northern-province-new-education-program",
      categorySlug: "education",
      title: "வட மாகாண மாணவர்களுக்கான புதிய கல்வித் திட்டம்",
      summary:
        "வட மாகாண பாடசாலை மாணவர்களின் கல்வித் திறனை மேம்படுத்த புதிய கல்வித் திட்டம் அறிமுகப்படுத்தப்படவுள்ளது.",
      content:
        "<p>மாணவர்களின் கணிதம், விஞ்ஞானம் மற்றும் தகவல் தொழில்நுட்ப திறன்களை மேம்படுத்தும் வகையில் புதிய கல்வித் திட்டம் அறிமுகப்படுத்தப்படவுள்ளது.</p>",
      image:
        "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200",
      caption: "மாணவர்கள் கல்வி கற்கும் காட்சி",
      breaking: false,
    },

    {
      slug: "sri-lanka-economic-growth",
      categorySlug: "business-economy",
      title: "இலங்கையின் பொருளாதார வளர்ச்சிக்கு புதிய வாய்ப்புகள்",
      summary:
        "சிறு மற்றும் நடுத்தர தொழில்களுக்கு புதிய வாய்ப்புகளை உருவாக்கும் நடவடிக்கைகள் குறித்து அதிகாரிகள் கவனம் செலுத்தியுள்ளனர்.",
      content:
        "<p>சிறு மற்றும் நடுத்தர தொழில்களை ஊக்குவிப்பதன் மூலம் நாட்டின் பொருளாதார வளர்ச்சியை அதிகரிக்க முடியும் என பொருளாதார நிபுணர்கள் தெரிவித்துள்ளனர்.</p>",
      image:
        "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200",
      caption: "வணிகக் கூட்டம் - மாதிரி படம்",
      breaking: false,
    },

    {
      slug: "jaffna-cricket-tournament",
      categorySlug: "sports",
      title: "யாழ்ப்பாணத்தில் மாபெரும் கிரிக்கெட் போட்டி",
      summary:
        "யாழ்ப்பாணத்தில் உள்ள இளம் கிரிக்கெட் வீரர்களை ஊக்குவிக்கும் வகையில் புதிய கிரிக்கெட் போட்டித் தொடர் ஆரம்பிக்கப்படவுள்ளது.",
      content:
        "<p>வட மாகாணத்தின் பல்வேறு பகுதிகளைச் சேர்ந்த இளம் வீரர்கள் இந்த போட்டித் தொடரில் பங்கேற்கவுள்ளனர்.</p>",
      image:
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200",
      caption: "கிரிக்கெட் போட்டி - மாதிரி படம்",
      breaking: false,
    },

    {
      slug: "new-film-release-sri-lanka",
      categorySlug: "entertainment",
      title: "புதிய திரைப்படம் வெளியீட்டுக்கு தயாராகிறது",
      summary:
        "இளம் கலைஞர்கள் இணைந்து உருவாக்கிய புதிய திரைப்படம் விரைவில் வெளியிடப்படவுள்ளது.",
      content:
        "<p>உள்ளூர் கலைஞர்களின் பங்களிப்புடன் உருவாக்கப்பட்டுள்ள புதிய திரைப்படம் ரசிகர்களிடையே எதிர்பார்ப்பை ஏற்படுத்தியுள்ளது.</p>",
      image:
        "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
      caption: "திரைப்பட அரங்கம் - மாதிரி படம்",
      breaking: false,
    },

    {
      slug: "new-digital-services",
      categorySlug: "politics",
      title: "அரச சேவைகளை டிஜிட்டல் மயமாக்க புதிய திட்டம்",
      summary:
        "மக்களுக்கு அரச சேவைகளை விரைவாக வழங்கும் நோக்கில் பல சேவைகளை இணைய வழியாக வழங்க நடவடிக்கை எடுக்கப்பட்டுள்ளது.",
      content:
        "<p>பொதுமக்கள் அலுவலகங்களுக்கு நேரடியாக செல்லாமல் பல அரச சேவைகளை இணையம் மூலம் பெறுவதற்கான நடவடிக்கைகள் முன்னெடுக்கப்படுகின்றன.</p>",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200",
      caption: "டிஜிட்டல் சேவை - மாதிரி படம்",
      breaking: true,
    },

    {
      slug: "world-technology-development",
      categorySlug: "world",
      title: "உலகளவில் செயற்கை நுண்ணறிவு தொழில்நுட்ப வளர்ச்சி",
      summary:
        "செயற்கை நுண்ணறிவு தொழில்நுட்பத்தின் பயன்பாடு பல்வேறு துறைகளில் வேகமாக அதிகரித்து வருகிறது.",
      content:
        "<p>கல்வி, மருத்துவம், வணிகம் மற்றும் தகவல் தொழில்நுட்பம் உள்ளிட்ட பல துறைகளில் செயற்கை நுண்ணறிவு தொழில்நுட்பம் பயன்படுத்தப்பட்டு வருகிறது.</p>",
      image:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200",
      caption: "செயற்கை நுண்ணறிவு - மாதிரி படம்",
      breaking: false,
    },

    {
      slug: "jaffna-police-community-program",
      categorySlug: "crime",
      title: "யாழ்ப்பாணத்தில் சமூக பாதுகாப்பு திட்டம்",
      summary:
        "பொதுமக்களின் பாதுகாப்பை மேம்படுத்தும் நோக்கில் புதிய சமூக பாதுகாப்பு நடவடிக்கைகள் முன்னெடுக்கப்படுகின்றன.",
      content:
        "<p>பொதுமக்களுடன் இணைந்து குற்றங்களைத் தடுப்பதற்கான விழிப்புணர்வு நடவடிக்கைகள் பல பகுதிகளில் முன்னெடுக்கப்படுகின்றன.</p>",
      image:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200",
      caption: "சமூக பாதுகாப்பு - மாதிரி படம்",
      breaking: false,
    },

    {
      slug: "northern-farmers-new-market",
      categorySlug: "business-economy",
      title: "வடக்கு விவசாயிகளுக்காக புதிய சந்தை வாய்ப்பு",
      summary:
        "விவசாயிகளின் உற்பத்திகளை நேரடியாக சந்தைப்படுத்த புதிய சந்தை வாய்ப்புகள் உருவாக்கப்படவுள்ளன.",
      content:
        "<p>விவசாயிகள் தங்கள் உற்பத்திகளை இடைத்தரகர்கள் இல்லாமல் சந்தைப்படுத்துவதற்கான புதிய முயற்சிகள் ஆரம்பிக்கப்படவுள்ளன.</p>",
      image:
        "https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?w=1200",
      caption: "விவசாய சந்தை - மாதிரி படம்",
      breaking: false,
    },

    {
      slug: "jaffna-school-technology-lab",
      categorySlug: "education",
      title: "யாழ்ப்பாண பாடசாலைகளில் புதிய தொழில்நுட்ப ஆய்வகங்கள்",
      summary:
        "மாணவர்களின் தொழில்நுட்ப அறிவை மேம்படுத்த பல பாடசாலைகளில் புதிய கணினி மற்றும் தொழில்நுட்ப ஆய்வகங்கள் அமைக்கப்படவுள்ளன.",
      content:
        "<p>தகவல் தொழில்நுட்ப கல்வியை மேம்படுத்தும் நோக்கில் பாடசாலைகளில் நவீன தொழில்நுட்ப வசதிகள் ஏற்படுத்தப்படவுள்ளன.</p>",
      image:
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200",
      caption: "தொழில்நுட்ப ஆய்வகம் - மாதிரி படம்",
      breaking: false,
    },

    {
      slug: "northern-sports-development",
      categorySlug: "sports",
      title: "வடக்கில் விளையாட்டுத்துறையை மேம்படுத்த புதிய திட்டம்",
      summary:
        "வட மாகாண இளைஞர்களின் விளையாட்டு திறமைகளை வளர்க்க புதிய விளையாட்டு மேம்பாட்டு திட்டம் அறிமுகப்படுத்தப்படவுள்ளது.",
      content:
        "<p>இளம் விளையாட்டு வீரர்களுக்கு பயிற்சி மற்றும் தேவையான வசதிகளை வழங்குவதற்கான திட்டம் முன்னெடுக்கப்படவுள்ளது.</p>",
      image:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200",
      caption: "விளையாட்டு பயிற்சி - மாதிரி படம்",
      breaking: false,
    },
  ];

  for (const news of newsData) {
    const category = await prisma.category.findUnique({
      where: {
        slug_locale: {
          slug: news.categorySlug,
          locale: Locale.ta,
        },
      },
    });

    if (!category) {
      console.log(`❌ Category not found: ${news.categorySlug}`);
      continue;
    }

    await prisma.article.upsert({
      where: {
        slug_locale: {
          slug: news.slug,
          locale: Locale.ta,
        },
      },

      update: {
        title: news.title,
        summary: news.summary,
        content: news.content,
        featuredImage: news.image,
        imageCaption: news.caption,
        status: ArticleStatus.PUBLISHED,
        isBreaking: news.breaking,
        categoryId: category.id,
        authorId: reporter.id,
        publishedAt: new Date(),
      },

      create: {
        title: news.title,
        slug: news.slug,
        locale: Locale.ta,
        summary: news.summary,
        content: news.content,
        featuredImage: news.image,
        imageCaption: news.caption,
        status: ArticleStatus.PUBLISHED,
        isBreaking: news.breaking,
        authorId: reporter.id,
        categoryId: category.id,
        publishedAt: new Date(),
        seoTitle: `${news.title} | சங்கதி`,
        seoDescription: news.summary,
      },
    });
  }

  console.log(`✅ ${newsData.length} தமிழ் செய்திகள் successfully seeded!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
