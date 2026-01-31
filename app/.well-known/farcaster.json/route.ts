function withValidProperties(
  properties: Record<string, undefined | string | string[]>,
) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
    }),
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL;

  // Convert relative paths to full HTTPS URLs
  const toFullUrl = (path: string) => path.startsWith('http') ? path : `${URL}${path}`;

  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: "1",
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME,
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE,
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      screenshotUrls: [],
      iconUrl: toFullUrl(process.env.NEXT_PUBLIC_APP_ICON || '/icon.png'),
      splashImageUrl: toFullUrl(process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || '/splash.png'),
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR,
      homeUrl: URL,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY,
      tags: ["freelance", "marketplace", "web3", "jobs", "hiring"],
      heroImageUrl: toFullUrl(process.env.NEXT_PUBLIC_APP_HERO_IMAGE || '/hero.png'),
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE,
      ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE,
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION,
      ogImageUrl: toFullUrl(process.env.NEXT_PUBLIC_APP_OG_IMAGE || '/og-image.png'),
    }),
    baseBuilder: {
      allowedAddresses: [],
    },
  });
}
