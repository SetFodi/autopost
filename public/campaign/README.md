# Real campaign media

This directory is reserved for the first excellent manual transformation of one
real vehicle. The site already has a disclosed generated showcase under
`public/demo`, so these paths are an optional upgrade rather than a launch
blocker. Do not mix stock or generated examples into this real-media directory.

Required files:

```text
public/campaign/originals/01.jpg
public/campaign/originals/02.jpg
public/campaign/originals/03.jpg
public/campaign/final/hero-after.jpg
public/campaign/final/reel.mp4
public/campaign/final/reel-poster.jpg
public/campaign/final/stories/01.jpg
public/campaign/final/stories/02.jpg
public/campaign/final/stories/03.jpg
public/campaign/final/carousel/01.jpg
public/campaign/final/carousel/02.jpg
public/campaign/final/carousel/03.jpg
public/campaign/final/carousel/04.jpg
public/campaign/final/carousel/05.jpg
public/campaign/final/carousel/06.jpg
public/campaign/final/marketplace-card.jpg
```

After adding the files, complete the real vehicle metadata and accessible alt
text in `config/campaign-assets.json`, set `CAMPAIGN_ASSET_SET=real`, and run
`pnpm campaign:check`. If any required real file is absent, the site safely uses
the bundled showcase instead.
