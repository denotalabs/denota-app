import Head from "next/head";
import LandingPage from "../components/landing/LandingPage";

const SITE_URL = "https://denota-pay.vercel.app/";
const PAGE_TITLE = "Denota — Payments with conditions";
const PAGE_DESCRIPTION =
  "Denota holds the money first, then releases it when your conditions are met. No wallet to set up, paid in US dollars, and free while we are in beta.";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Denota",
      url: `${SITE_URL}/`,
      description: PAGE_DESCRIPTION,
    },
    {
      "@type": "SoftwareApplication",
      name: "Denota",
      url: `${SITE_URL}/`,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description: PAGE_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

function HomePage() {
  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} key="description" />
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
          key="robots"
        />
        <link rel="canonical" href={`${SITE_URL}/`} key="canonical" />

        <meta property="og:type" content="website" key="og:type" />
        <meta property="og:site_name" content="Denota" key="og:site_name" />
        <meta property="og:locale" content="en_US" key="og:locale" />
        <meta property="og:url" content={`${SITE_URL}/`} key="og:url" />
        <meta property="og:title" content={PAGE_TITLE} key="og:title" />
        <meta
          property="og:description"
          content={PAGE_DESCRIPTION}
          key="og:description"
        />

        <meta name="twitter:card" content="summary" key="twitter:card" />
        <meta name="twitter:title" content={PAGE_TITLE} key="twitter:title" />
        <meta
          name="twitter:description"
          content={PAGE_DESCRIPTION}
          key="twitter:description"
        />

        <meta name="theme-color" content="#1C203A" key="theme-color" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </Head>
      <LandingPage />
    </>
  );
}

export default HomePage;
