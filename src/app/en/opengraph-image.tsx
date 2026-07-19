import { ImageResponse } from 'next/og'

export const alt =
  'AutoPost — professional car advertising from ordinary vehicle photos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function EnglishOpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'stretch',
        background: '#0c0b0a',
        color: '#f4eee4',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: '56px 64px',
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -80,
          right: -40,
          width: 420,
          height: 420,
          borderRadius: 999,
          background: 'rgba(232,160,58,0.12)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              alignItems: 'center',
              border: '1.5px solid rgba(232,160,58,0.7)',
              color: '#e8a03a',
              display: 'flex',
              fontSize: 18,
              fontWeight: 700,
              height: 52,
              justifyContent: 'center',
              letterSpacing: 1,
              width: 52,
            }}
          >
            AP
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>AutoPost</div>
        </div>
        <div
          style={{
            color: '#e8a03a',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 5,
          }}
        >
          BUILT FOR CAR SELLERS
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 1000 }}>
        <div style={{ color: '#e8a03a', fontSize: 28, fontWeight: 700 }}>
          3–15 PHOTOS →
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            letterSpacing: -4,
            lineHeight: 0.98,
            marginTop: 12,
          }}
        >
          A professional car-ad content kit
        </div>
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(244,238,228,.14)',
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 22,
        }}
      >
        <div style={{ color: 'rgba(244,238,228,.58)', fontSize: 20 }}>
          Reel · Stories · Carousel · Post · Copy
        </div>
        <div style={{ color: '#e8a03a', fontSize: 20, fontWeight: 700 }}>
          FIRST PREVIEW FREE
        </div>
      </div>
    </div>,
    size,
  )
}
