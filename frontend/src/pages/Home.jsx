import React from 'react'

function Home() {
  return (
    <iframe
      src="/index.html"
      title="Pokémon Team Builder"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
      }}
    />
  )
}

export default Home