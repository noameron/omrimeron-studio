import HomeVideo from '@/components/HomeVideo'

// "/" plays the behind-the-scenes brand video fullscreen without sound
// (owner request 2026-07-19), replacing the random-draw Sanity slider.
export default function HomePage() {
  return <HomeVideo src="/brand/behind_scenes.mp4" />
}
