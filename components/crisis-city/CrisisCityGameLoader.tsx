'use client'

import dynamic from 'next/dynamic'

// ssr:false : le jeu monte un canvas WebGL/three.js impératif (components/crisis-city/ui/Scene3D.jsx)
// qui n'a aucun sens côté serveur — on ne le charge que dans le navigateur.
const CrisisCityGame = dynamic(() => import('./CrisisCityGame.jsx'), { ssr: false })

export default function CrisisCityGameLoader() {
  return <CrisisCityGame />
}
