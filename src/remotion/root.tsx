import { loadFont } from '@remotion/google-fonts/NotoSansGeorgian'
import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion'

const { fontFamily } = loadFont('normal', {
  weights: ['400', '700', '900'],
  subsets: ['georgian', 'latin'],
})

export type VehicleReelProps = {
  photos: string[]
  phone: string
  vehicleModel: string
  vehicleYear: number
  priceLabel: string
  publicReference: string
  watermarked: boolean
}

const BRAND = {
  amber: '#ffbe5c',
  graphite: '#0c0b0a',
  ivory: '#f4eee4',
}

function Watermark({ enabled }: { enabled: boolean }) {
  if (!enabled) return null
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        transform: 'rotate(-18deg)',
      }}
    >
      <div
        style={{
          color: 'rgba(255,255,255,.62)',
          fontFamily,
          fontSize: 86,
          fontWeight: 900,
          letterSpacing: '0.12em',
          textShadow: '0 4px 24px rgba(0,0,0,.55)',
          whiteSpace: 'nowrap',
        }}
      >
        AUTOPOST PREVIEW
      </div>
    </AbsoluteFill>
  )
}

function BrandFrame({ label }: { label: string }) {
  return (
    <AbsoluteFill style={{ padding: '100px 80px', pointerEvents: 'none' }}>
      <div
        style={{
          height: '100%',
          border: '3px solid rgba(244,238,228,.42)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 34,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: BRAND.ivory,
            fontFamily,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '0.14em',
          }}
        >
          <span style={{ color: BRAND.amber }}>AUTOPOST / GE</span>
          <span>{label}</span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function ContainedPhoto({
  photo,
  progress = 0,
  direction = 1,
  bottomInset,
}: {
  photo: string
  progress?: number
  direction?: 1 | -1
  bottomInset: number
}) {
  const topInset = 76
  const sideInset = 42

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={photo}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(38px) brightness(.5) saturate(.72)',
          opacity: 0.9,
          scale: 1.16,
          translate: `${direction * progress * 12}px 0`,
        }}
      />
      <AbsoluteFill style={{ backgroundColor: 'rgba(12,11,10,.2)' }} />
      <Img
        src={photo}
        style={{
          position: 'absolute',
          top: topInset,
          left: sideInset,
          width: `calc(100% - ${sideInset * 2}px)`,
          height: `calc(100% - ${topInset + bottomInset}px)`,
          objectFit: 'contain',
          filter: 'drop-shadow(0 28px 50px rgba(0,0,0,.48))',
          scale: 0.985 + progress * 0.015,
          translate: `${direction * progress * 8}px 0`,
        }}
      />
    </AbsoluteFill>
  )
}

function PhotoScene({
  photo,
  label,
  index,
}: {
  photo: string
  label: string
  index: number
}) {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [0, 84], [0, 1], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const enter = interpolate(frame, [0, 18], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.graphite }}>
      <ContainedPhoto
        photo={photo}
        progress={progress}
        direction={index % 2 === 0 ? -1 : 1}
        bottomInset={210}
      />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(12,11,10,.12) 35%, rgba(12,11,10,.82) 100%)',
        }}
      />
      <BrandFrame label={label} />
      <div
        style={{
          position: 'absolute',
          left: 114,
          right: 114,
          bottom: 150,
          display: 'flex',
          justifyContent: 'flex-end',
          color: BRAND.ivory,
          fontFamily,
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '0.13em',
          opacity: enter,
          translate: `0 ${interpolate(enter, [0, 1], [32, 0])}px`,
        }}
      >
        DETAIL / 0{index + 1}
      </div>
    </AbsoluteFill>
  )
}

function IntroScene({
  photo,
  vehicleModel,
  vehicleYear,
}: Pick<VehicleReelProps, 'vehicleModel' | 'vehicleYear'> & {
  photo: string
}) {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [6, 34], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.graphite }}>
      <ContainedPhoto photo={photo} bottomInset={350} />
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(12,11,10,.28), rgba(12,11,10,.12) 42%, rgba(12,11,10,.94))',
        }}
      />
      <BrandFrame label="FOR SALE / 9:16" />
      <div
        style={{
          position: 'absolute',
          left: 114,
          right: 114,
          bottom: 170,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          color: BRAND.ivory,
          fontFamily,
          opacity: enter,
          translate: `0 ${interpolate(enter, [0, 1], [54, 0])}px`,
        }}
      >
        <div
          style={{
            color: BRAND.amber,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '0.12em',
          }}
        >
          {vehicleYear} · იყიდება
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 0.98,
            letterSpacing: '-0.055em',
          }}
        >
          {vehicleModel}
        </div>
      </div>
    </AbsoluteFill>
  )
}

function OutroScene({
  vehicleModel,
  priceLabel,
  publicReference,
  phone,
}: Pick<
  VehicleReelProps,
  'vehicleModel' | 'priceLabel' | 'publicReference' | 'phone'
>) {
  const frame = useCurrentFrame()
  const enter = interpolate(frame, [0, 30], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.graphite,
        color: BRAND.ivory,
        fontFamily,
        padding: '130px 90px',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 34,
          borderTop: `4px solid ${BRAND.amber}`,
          borderBottom: '2px solid rgba(244,238,228,.24)',
          padding: '70px 0',
          opacity: enter,
          translate: `0 ${interpolate(enter, [0, 1], [45, 0])}px`,
        }}
      >
        <div
          style={{
            color: BRAND.amber,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.14em',
          }}
        >
          მზადაა ახალი მფლობელისთვის
        </div>
        <div
          style={{
            fontSize: 86,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.055em',
          }}
        >
          {vehicleModel}
        </div>
        <div style={{ fontSize: 64, fontWeight: 900 }}>{priceLabel}</div>
        <div style={{ fontSize: 38, fontWeight: 700 }}>{phone}</div>
        <div
          style={{
            marginTop: 30,
            fontSize: 26,
            opacity: 0.62,
            letterSpacing: '0.12em',
          }}
        >
          {publicReference} · AUTOPOST.GE
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function VehicleReel(props: VehicleReelProps) {
  const photos = props.photos.length > 0 ? props.photos : ['']
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.graphite }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={100} premountFor={30}>
          <IntroScene
            photo={photos[0]!}
            vehicleModel={props.vehicleModel}
            vehicleYear={props.vehicleYear}
          />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />
        {[1, 2, 3, 4]
          .map((index) => (
            <TransitionSeries.Sequence
              key={index}
              durationInFrames={82}
              premountFor={30}
            >
              <PhotoScene
                photo={photos[index % photos.length]!}
                index={index}
                label="AUTOMOTIVE / EDIT"
              />
            </TransitionSeries.Sequence>
          ))
          .flatMap((sequence, index, sequences) =>
            index === sequences.length - 1
              ? [sequence]
              : [
                  sequence,
                  <TransitionSeries.Transition
                    key={`transition-${index}`}
                    presentation={slide({ direction: 'from-right' })}
                    timing={linearTiming({ durationInFrames: 12 })}
                  />,
                ],
          )}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 16 })}
        />
        <TransitionSeries.Sequence durationInFrames={98} premountFor={30}>
          <OutroScene
            vehicleModel={props.vehicleModel}
            priceLabel={props.priceLabel}
            publicReference={props.publicReference}
            phone={props.phone}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      <Watermark enabled={props.watermarked} />
    </AbsoluteFill>
  )
}

export function RemotionRoot() {
  return (
    <Composition
      id="AutoPostVehicleReel"
      component={VehicleReel}
      durationInFrames={458}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        photos: [
          staticFile('demo/after-mercedes.jpg'),
          staticFile('demo/after-audi.jpg'),
          staticFile('demo/after-porsche.jpg'),
          staticFile('demo/after-tesla.jpg'),
          staticFile('demo/format-card.jpg'),
        ],
        vehicleModel: 'Porsche 911 Carrera',
        vehicleYear: 2024,
        priceLabel: '189,000 GEL',
        phone: '+995555123456',
        publicReference: 'AP-DEMO000001',
        watermarked: true,
      }}
    />
  )
}
