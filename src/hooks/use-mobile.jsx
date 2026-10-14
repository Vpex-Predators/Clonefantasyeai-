import * as React from "react"

const QUERY = "(max-width: 767px)"
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== "undefined" && window.matchMedia(QUERY).matches)
  React.useEffect(() => {
    const media = window.matchMedia(QUERY)
    const update = () => setIsMobile(media.matches)
    update()
    // Older Android WebViews expose only the legacy MediaQueryList API.
    if (media.addEventListener) media.addEventListener("change", update)
    else media.addListener(update)
    return () => {
      if (media.removeEventListener) media.removeEventListener("change", update)
      else media.removeListener(update)
    }
  }, [])
  return isMobile
}
